import "webjsx";
import { VNode } from "webjsx";
import { ConnectionInfo } from "../messageTypes.js";

declare module "webjsx" {
  namespace JSX {
    interface IntrinsicElements {
      "codespin-sync-icon": {};
      "codespin-icon": {};
      "codespin-sync-button": {};
      "codespin-inbound-button": {};
      "codespin-sync-form": {};
      "codespin-connection": {
        resolve?: (info: ConnectionInfo | undefined) => void;
      };
      "codespin-modal-dialog": {
        ref?: (el: HTMLElement) => void;
        resolve?: () => void;
        children: VNode | VNode[];
      };
      "codespin-modal-message": {
        resolve?: () => void;
        children: VNode | VNode[];
      };
      "codespin-file-importer": {
        onselect?: (event: CustomEvent<string[]>) => void;
        oncancel?: (event: Event) => void;
      };
      "codespin-file-tree": {
        onselect?: (event: CustomEvent<string[]>) => void;
        oncancel?: (event: Event) => void;
      };
      "codespin-file-content-viewer": {
        style?: string;
      };
      "side-drawer": {
        id?: string;
        open?: boolean;
        right?: string;
        children?: VNode | VNode[];
        style?: string;
      };
    }
  }
}
