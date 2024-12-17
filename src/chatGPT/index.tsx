// File path:./src/chatGPT/index.tsx
import * as webjsx from "../libs/webjsx/factory.js";

import "./components/ChatGPTInboundButton.js";
import "./components/ChatGPTSyncButton.js";
import "../components/FileImporter.js";
import "../components/FileTree.js";
import "../components/FileContentViewer.js";
import "../components/icons/CodeSpinIcon.js";
import "../components/icons/SyncIcon.js";
import "../components/FileWriter.js";
import "../components/ChangeTree.js";
import "../components/FileEdits.js";
import { createNode } from "../libs/webjsx/createNode.js";

/**
 * Attaches a sync button (<codespin-chatgpt-sync-button>) to a specific <pre> element.
 * @param preElement The <pre> element to which the sync button will be attached.
 */
function addSyncButtonToDOM(preElement: HTMLElement) {
  const previousElement = preElement.previousElementSibling;
  if (!previousElement?.textContent?.startsWith("File path:")) {
    return;
  }

  const copyButtonContainer = preElement.querySelector(
    "div > div > div > span > button"
  )?.parentElement?.parentElement;

  if (copyButtonContainer) {
    const syncButton = createNode(<codespin-chatgpt-sync-button />);
    copyButtonContainer.parentElement?.insertBefore(
      syncButton,
      copyButtonContainer
    );
  }
}

/**
 * Attaches CodeSpin links to all <pre> elements on the page.
 * This function should be called periodically to handle dynamically added code blocks.
 */
async function attachSyncButton() {
  const codeBlocks = document.querySelectorAll("pre");

  codeBlocks.forEach((preElement) => {
    if (!preElement.dataset.codespinAttached) {
      addSyncButtonToDOM(preElement);
      preElement.dataset.codespinAttached = "true";
    }
  });
}

// This needs to run only once because the textbox is created only once.
async function attachInboundButton() {
  if (!document.querySelector("codespin-chatgpt-inbound-button")) {
    const composerBackground = document.getElementById("composer-background");
    if (!composerBackground) return;

    const buttons = composerBackground.querySelectorAll("button");
    const buttonsArray = Array.from(buttons);

    // Get the second to last button
    const targetButton = buttonsArray[buttonsArray.length - 2];

    // Ensure the button is found before proceeding
    if (targetButton) {
      // Create a new custom element
      const inboundButton = createNode(
        <codespin-chatgpt-inbound-button></codespin-chatgpt-inbound-button>
      );

      // Insert the custom element right after the button
      targetButton.parentElement?.parentElement?.insertAdjacentElement(
        "afterend",
        inboundButton as Element
      );
    }
  }
}

/**
 * Initializes the CodeSpin functionality by setting up necessary components
 * and observers.
 */
export function initializeCodeSpin() {
  // Initial attachment of CodeSpin links
  attachSyncButton();

  // We need to attach the inbound button
  attachInboundButton();

  // Optionally, set up periodic checks (if necessary)
  setInterval(() => {
    attachSyncButton();
    attachInboundButton();
  }, 3000);
}
