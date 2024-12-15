import * as webjsx from "../libs/webjsx/factory.js";
import "./components/ClaudeInboundButton.js";
import "./components/ClaudeSyncButton.js";
import "../components/FileImporter.js";
import "../components/FileTree.js";
import "../components/FileContentViewer.js";
import "../components/icons/CodeSpinIcon.js";
import "../components/icons/SyncIcon.js";
import "../components/FileWriter.js";
import "../components/ChangeTree.js";
import "../components/FileEdits.js";
import { createNode } from "../libs/webjsx/createNode.js";

function addSyncButtonToDOM(preElement: HTMLElement) {
  const previousElement = preElement.previousElementSibling;
  if (!previousElement?.textContent?.startsWith("File path:")) {
    return;
  }

  // Find button with "Copy" text inside the pre element
  const copyButton = Array.from(preElement.querySelectorAll("button")).find(
    (button) => button.textContent?.trim() === "Copy"
  );

  if (copyButton) {
    const syncButton = createNode(
      <codespin-claude-sync-button style="float: left" />
    );
    copyButton.parentElement?.insertBefore(syncButton, copyButton);
  }
}

async function attachSyncButton() {
  const codeBlocks = document.querySelectorAll("pre");

  codeBlocks.forEach((preElement) => {
    if (!preElement.dataset.codespinAttached) {
      addSyncButtonToDOM(preElement);
      preElement.dataset.codespinAttached = "true";
    }
  });
}

async function attachInboundButton() {
  if (!document.querySelector("codespin-claude-inbound-button")) {
    // Find the upload content button container
    const uploadButtonContainer = document.querySelector(
      'button[aria-label="Upload content"]'
    );

    if (uploadButtonContainer) {
      const inboundButton = createNode(
        <codespin-claude-inbound-button></codespin-claude-inbound-button>
      );

      // Insert after the upload button
      uploadButtonContainer.insertAdjacentElement(
        "afterend",
        inboundButton as Element
      );
    }
  }
}

export function initializeCodeSpin() {
  attachSyncButton();
  attachInboundButton();

  setInterval(() => {
    attachSyncButton();
    attachInboundButton();
  }, 3000);
}
