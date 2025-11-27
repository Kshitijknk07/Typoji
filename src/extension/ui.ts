type SuggestionHandlers = {
  onAccept: () => void;
  onDismiss: () => void;
};

type SuggestionPayload = {
  word: string;
  emoji: string;
};

export class SuggestionHost {
  private container: HTMLDivElement | null = null;
  private handlers: SuggestionHandlers | null = null;

  show(target: HTMLElement, payload: SuggestionPayload, handlers: SuggestionHandlers) {
    this.hide();
    this.handlers = handlers;
    const node = document.createElement("div");
    node.style.position = "absolute";
    node.style.zIndex = "2147483647";
    node.style.background = "#111217";
    node.style.color = "#f5f5f5";
    node.style.borderRadius = "8px";
    node.style.padding = "8px 12px";
    node.style.display = "flex";
    node.style.alignItems = "center";
    node.style.gap = "12px";
    node.style.boxShadow = "0 8px 24px rgba(0,0,0,0.25)";
    node.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    node.style.fontSize = "13px";
    node.style.lineHeight = "1";

    const label = document.createElement("span");
    label.textContent = `Replace “${payload.word}” with ${payload.emoji}?`;
    node.appendChild(label);

    const buttons = document.createElement("div");
    buttons.style.display = "flex";
    buttons.style.gap = "8px";

    const accept = document.createElement("button");
    accept.textContent = "Replace";
    accept.style.border = "none";
    accept.style.background = "#4ade80";
    accept.style.color = "#0f172a";
    accept.style.fontWeight = "600";
    accept.style.borderRadius = "6px";
    accept.style.padding = "6px 10px";
    accept.style.cursor = "pointer";
    accept.onclick = () => this.accept();

    const dismiss = document.createElement("button");
    dismiss.textContent = "Skip";
    dismiss.style.border = "1px solid #475569";
    dismiss.style.background = "transparent";
    dismiss.style.color = "#f5f5f5";
    dismiss.style.borderRadius = "6px";
    dismiss.style.padding = "6px 10px";
    dismiss.style.cursor = "pointer";
    dismiss.onclick = () => this.dismiss();

    buttons.appendChild(accept);
    buttons.appendChild(dismiss);
    node.appendChild(buttons);

    document.body.appendChild(node);
    this.container = node;
    this.position(target);
    document.addEventListener("pointerdown", this.handlePointer, true);
    window.addEventListener("resize", this.handleResize);
    window.addEventListener("scroll", this.handleResize, true);
  }

  hide() {
    if (!this.container) {
      return;
    }
    document.removeEventListener("pointerdown", this.handlePointer, true);
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("scroll", this.handleResize, true);
    this.container.remove();
    this.container = null;
    this.handlers = null;
  }

  private accept() {
    this.handlers?.onAccept();
    this.hide();
  }

  private dismiss() {
    this.handlers?.onDismiss();
    this.hide();
  }

  private position(target: HTMLElement) {
    if (!this.container) return;
    const rect = target.getBoundingClientRect();
    const top = window.scrollY + rect.bottom + 8;
    const left = window.scrollX + rect.left;
    this.container.style.top = `${top}px`;
    this.container.style.left = `${left}px`;
  }

  private handlePointer = (event: Event) => {
    if (!this.container) return;
    if (this.container.contains(event.target as Node)) {
      return;
    }
    this.dismiss();
  };

  private handleResize = () => {
    if (!this.container) return;
    const anchor = document.activeElement as HTMLElement | null;
    if (anchor) {
      this.position(anchor);
    } else {
      this.hide();
    }
  };
}
