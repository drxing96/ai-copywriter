import * as webjsx from "../../libs/webjsx/index.js";
import { applyDiff } from "../../libs/webjsx/index.js";
import { getCSS } from "../../api/loadCSS.js";

const styleSheet = await getCSS("./FileTree.css", import.meta.url);

interface FileNode {
  type: "file" | "directory";
  name: string;
  path?: string;
  contents?: FileNode[];
}

export class ChangeTree extends HTMLElement {
  #expandedNodes: Set<string> = new Set();
  #selectedFiles: Set<string> = new Set();
  #files: FileNode[] = [];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.adoptedStyleSheets = [styleSheet];
  }

  #normalizePath(path: string): string {
    return path.replace(/^\.?\//, "");
  }

  #buildFileTree(files: { path: string; content: string }[]): FileNode {
    const dirMap: { [key: string]: FileNode } = {};

    // Create root node
    const rootNode: FileNode = {
      type: "directory",
      name: "Changed Files",
      contents: [],
    };

    files.forEach((file) => {
      const normalizedPath = this.#normalizePath(file.path);
      const parts = normalizedPath.split("/");

      let currentPath = "";
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!dirMap[currentPath]) {
          dirMap[currentPath] = {
            type: "directory",
            name: part,
            contents: [],
          };
        }
      }

      const fileName = parts[parts.length - 1];
      const fileNode: FileNode = {
        type: "file",
        name: fileName,
        path: file.path,
      };

      const parentPath = parts.slice(0, -1).join("/");
      if (parentPath) {
        dirMap[parentPath].contents!.push(fileNode);
      } else {
        rootNode.contents!.push(fileNode);
      }
    });

    // Add directories to their parents
    Object.entries(dirMap).forEach(([path, node]) => {
      const parts = path.split("/");
      if (parts.length === 1) {
        rootNode.contents!.push(node);
      } else {
        const parentPath = parts.slice(0, -1).join("/");
        if (dirMap[parentPath]) {
          dirMap[parentPath].contents!.push(node);
        }
      }
    });

    // Sort nodes
    const sortNodes = (nodes: FileNode[]) => {
      nodes.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "directory" ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      nodes.forEach((node) => {
        if (node.type === "directory" && node.contents) {
          sortNodes(node.contents);
        }
      });
    };

    if (rootNode.contents) {
      sortNodes(rootNode.contents);
    }

    return rootNode;
  }

  setFiles(
    files: { path: string; content: string }[],
    initialSelected: string
  ) {
    const rootNode = this.#buildFileTree(files);
    this.#files = [rootNode];
    this.#selectedFiles = new Set([initialSelected]);

    // Expand directories to show selected file
    const selectedPath = this.#normalizePath(initialSelected);
    const parts = selectedPath.split("/");
    let currentPath = "";
    parts.forEach((part, index) => {
      if (index < parts.length - 1) {
        currentPath += (currentPath ? "/" : "") + part;
        this.#expandedNodes.add(currentPath);
      }
    });

    this.render();
  }

  handleDirClick(e: MouseEvent, path: string) {
    e.stopPropagation();
    if (this.#expandedNodes.has(path)) {
      this.#expandedNodes.delete(path);
    } else {
      this.#expandedNodes.add(path);
    }
    this.render();
  }

  handleSelect(e: MouseEvent, path: string, node: FileNode) {
    e.stopPropagation();

    if (node.type === "file") {
      const prevSelection = new Set(this.#selectedFiles);

      if (!e.ctrlKey && !e.metaKey) {
        this.#selectedFiles.clear();
        this.#selectedFiles.add(path);
      } else {
        if (this.#selectedFiles.has(path)) {
          this.#selectedFiles.delete(path);
        } else {
          this.#selectedFiles.add(path);
        }
      }

      // Only dispatch if selection changed
      const newSelection = Array.from(this.#selectedFiles);
      const prevArray = Array.from(prevSelection);
      if (
        newSelection.length !== prevArray.length ||
        !newSelection.every((file) => prevSelection.has(file))
      ) {
        this.dispatchEvent(new CustomEvent("select", { detail: newSelection }));
      }
    }

    this.render();
  }

  renderNode(node: FileNode, path: string, isRoot: boolean = false) {
    const fullPath = path ? `${path}/${node.name}` : node.name;
    const isExpanded = isRoot || this.#expandedNodes.has(fullPath);
    const isSelected = node.path && this.#selectedFiles.has(node.path);

    if (node.type === "file") {
      return (
        <div
          class={`file-item ${isSelected ? "selected" : ""}`}
          onclick={(e) => this.handleSelect(e, node.path!, node)}
        >
          <span>📄</span>
          <span>{node.name}</span>
        </div>
      );
    }

    return (
      <div>
        <div
          class={`dir-item ${isRoot ? "root" : ""}`}
          onclick={(e) => !isRoot && this.handleDirClick(e, fullPath)}
        >
          {!isRoot && <span>{isExpanded ? "▾" : "▸"}</span>}
          <span>📁</span>
          <span>{node.name}</span>
        </div>
        {isExpanded && node.contents && (
          <div class={`dir-contents ${isRoot ? "root" : ""}`}>
            {node.contents.map((child) => this.renderNode(child, fullPath))}
          </div>
        )}
      </div>
    );
  }

  render() {
    const container = (
      <div class="tree-container">
        {this.#files.map((file) => this.renderNode(file, "", true))}
      </div>
    );

    applyDiff(this.shadowRoot!, container);
  }

  getSelectedFiles(): string[] {
    return Array.from(this.#selectedFiles);
  }
}

customElements.define("codespin-change-tree", ChangeTree);
