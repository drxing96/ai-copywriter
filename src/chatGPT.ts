import { writeFile } from "./writeFile.js";
import { CodeSpinButtonHtml } from "./CodeSpinButtonHtml.js";

let cachedProjectSyncUrl: string | null = null; // In-memory cache for the project sync URL

function findFilePathInMarkdownProse(element: HTMLElement): string | null {
  let sibling = element.previousElementSibling as HTMLElement | null;

  while (sibling) {
    if (sibling.tagName.toLowerCase() === "pre") {
      return null;
    }

    const textContent = sibling.textContent || "";
    const filePathMatch = textContent.match(
      /File path:\s*["'`]?(.+?)["'`]?(\n|$)/
    );

    if (filePathMatch) {
      return filePathMatch[1].trim();
    }

    sibling = sibling.previousElementSibling as HTMLElement | null;
  }

  return null;
}

async function extractProjectSyncUrl(): Promise<string | null> {
  if (cachedProjectSyncUrl) {
    return cachedProjectSyncUrl;
  }

  const match = document.body.innerText.match(
    /The project's sync url is "(https?:\/\/[^\s]+)"/
  );

  if (match) {
    cachedProjectSyncUrl = match[1];
    showSyncOverlayButton(); // Show the overlay button when the URL is set
    return cachedProjectSyncUrl;
  }

  return requestProjectSyncUrlFromUser();
}

function requestProjectSyncUrlFromUser(): Promise<string | null> {
  const dialogHtml = `
    <dialog id="codespin-dialog" style="width: 400px; background-color: black; color: #ccc; border-radius: 8px; padding: 20px; border: solid #fff; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);">
      <label for="codespin-url">Project sync url:</label><br>
      <input type="text" id="codespin-url" name="codespin-url" style="width: 100%; color: black; margin-top: 10px; padding: 5px; border-radius: 4px; border: 1px solid #ccc;" required value="${
        cachedProjectSyncUrl || ""
      }"><br><br>
      <button id="codespin-submit" style="background-color: green; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">Submit</button>
      <button id="codespin-cancel" style="background-color: #f44336; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">Cancel</button>
    </dialog>
  `;

  document.body.insertAdjacentHTML("beforeend", dialogHtml);

  const dialog = document.getElementById(
    "codespin-dialog"
  ) as HTMLDialogElement;
  dialog.showModal();

  return new Promise<string | null>((resolve) => {
    document.getElementById("codespin-submit")!.onclick = () => {
      const url = (document.getElementById("codespin-url") as HTMLInputElement)
        .value;
      cachedProjectSyncUrl = url || null;
      dialog.close();
      dialog.remove();
      if (cachedProjectSyncUrl) {
        showSyncOverlayButton(); // Show the overlay button when the URL is set
      } else {
        removeSyncOverlayButton(); // Remove the overlay button when the URL is cleared
      }
      resolve(cachedProjectSyncUrl);
    };

    document.getElementById("codespin-cancel")!.onclick = () => {
      dialog.close();
      dialog.remove();
      resolve(null);
    };
  });
}

function showSyncOverlayButton() {
  let overlayButton = document.getElementById("codespin-overlay-button");

  if (!overlayButton) {
    const buttonHtml = `
      <button id="codespin-overlay-button" style="position: fixed; bottom: 20px; right: 20px; background-color: blue; color: white; padding: 10px 20px; border: none; border-radius: 50px; cursor: pointer; z-index: 1000;">
        Syncing...
      </button>
    `;
    document.body.insertAdjacentHTML("beforeend", buttonHtml);

    overlayButton = document.getElementById("codespin-overlay-button");
  }

  overlayButton!.onclick = () => {
    requestProjectSyncUrlFromUser();
  };
}

function removeSyncOverlayButton() {
  const overlayButton = document.getElementById("codespin-overlay-button");
  if (overlayButton) {
    overlayButton.remove();
  }
}

async function handleCodeSpinSyncClick(
  preElement: HTMLElement,
  filePath: string
) {
  const projectSyncUrl = await extractProjectSyncUrl();
  const codeText = preElement.querySelector("code")?.innerText || "";

  if (projectSyncUrl && filePath && codeText) {
    const message = {
      type: "code",
      filePath: filePath,
      contents: codeText,
    };

    if ((globalThis as any).__CODESPIN_DEBUG__) {
      console.log({ message });
    }

    writeFile(projectSyncUrl, message);
  }
}

async function attachChatGPTButton(preElement: HTMLElement) {
  const filePath = findFilePathInMarkdownProse(preElement);

  if (filePath) {
    const copyButtonContainer = preElement.querySelector(
      "div > div > div > span > button"
    )?.parentElement?.parentElement;

    if (copyButtonContainer) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(CodeSpinButtonHtml, "text/html");
      const codeSpinButtonElement = doc.body.firstChild as HTMLElement;

      codeSpinButtonElement.onclick = () =>
        handleCodeSpinSyncClick(preElement, filePath);

      copyButtonContainer.parentElement?.insertBefore(
        codeSpinButtonElement,
        copyButtonContainer
      );
    }
  }
}

export function attachLinksForChatGPT() {
  const codeBlocks = document.querySelectorAll("pre");

  codeBlocks.forEach((preElement) => {
    if (!(preElement as any).attachedCodespinLink) {
      attachChatGPTButton(preElement as HTMLElement);
      (preElement as any).attachedCodespinLink = true;
    }
  });
}

setTimeout(() => {
  attachLinksForChatGPT();
}, 1000);

setInterval(() => {
  attachLinksForChatGPT();
}, 3000);
