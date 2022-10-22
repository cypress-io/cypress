export class WebCounter extends HTMLElement {
  static get observedAttributes() {
    return ["count", "docsHint", "clicked"];
  }
  button: HTMLButtonElement;
  clickListener: EventListener;
  h1: HTMLHeadingElement;
  clicked: (count: number) => void;

  get count(): string | null {
    return this.getAttribute("count") || "0";
  }

  get docsHint(): string | null {
    return (
      this.getAttribute("docsHint") ||
      "Click on the Vite and Lit logos to learn more"
    );
  }

  constructor() {
    super();

    this.clicked = (count: number) => {
      return;
    };

    this.attachShadow({ mode: "open" });

    const div = document.createElement("div");
    const vite = div.appendChild(document.createElement("a"));

    vite.setAttribute("href", "https://vitejs.dev");
    vite.setAttribute("target", "_blank");

    const logo = vite.appendChild(document.createElement("img"));

    logo.setAttribute("src", "/vite.svg");
    logo.setAttribute("class", "logo");

    const slot = document.createElement("slot");

    const cardDiv = document.createElement("div");
    cardDiv.setAttribute("class", "card");

    const h1 = cardDiv.appendChild(document.createElement("h1"));
    h1.innerHTML = `Count is ${this.count}`;

    this.h1 = h1;

    const button = cardDiv.appendChild(document.createElement("button"));
    button.setAttribute("part", "button");
    button.innerHTML = "Add more";
    this.button = button;
    this.clickListener = () => {
      let val = this.count && parseInt(this.count);

      if (typeof val === "number") {
        this.clicked(val);
        val++;
        this.setAttribute("count", String(val));
      }
    };

    this.button.addEventListener("click", this.clickListener);

    const paragraph = document.createElement("p");

    paragraph.setAttribute("class", "read-the-docs");
    paragraph.innerHTML =
      this.docsHint === null
        ? "Click on the Vite and Lit logos to learn more"
        : this.docsHint;

    const style = document.createElement("style");
    style.textContent = `
        :host {
          max-width: 1280px;
          margin: 0 auto;
          padding: 2rem;
          text-align: center;
        }

        .logo {
          height: 6em;
          padding: 1.5em;
          will-change: filter;
        }
        .logo:hover {
          filter: drop-shadow(0 0 2em #646cffaa);
        }
        .logo.lit:hover {
          filter: drop-shadow(0 0 2em #325cffaa);
        }

        .card {
          padding: 2em;
        }

        .read-the-docs {
          color: #888;
        }

        h1 {
          font-size: 3.2em;
          line-height: 1.1;
        }

        a {
          font-weight: 500;
          color: #646cff;
          text-decoration: inherit;
        }
        a:hover {
          color: #535bf2;
        }

        button {
          border-radius: 8px;
          border: 1px solid transparent;
          padding: 0.6em 1.2em;
          font-size: 1em;
          font-weight: 500;
          font-family: inherit;
          background-color: #1a1a1a;
          cursor: pointer;
          transition: border-color 0.25s;
        }
        button:hover {
          border-color: #646cff;
        }
        button:focus,
        button:focus-visible {
          outline: 4px auto -webkit-focus-ring-color;
        }

        @media (prefers-color-scheme: light) {
          a:hover {
            color: #747bff;
          }
          button {
            background-color: #f9f9f9;
          }
        }
      }`;

    this.shadowRoot?.append(style, div, slot, cardDiv, paragraph);
  }

  connectedCallback() {
    this.update();
  }

  disconnectedCallback() {
    this.button.removeEventListener("click", this.clickListener);
  }

  update() {
    this.h1.innerHTML = `Count is ${this.count}`;
  }

  attributeChangedCallback(name: string) {
    if (name === "count") {
      this.update();
    }
  }
}

if (!customElements.get("counter-wc")) {
  customElements.define("counter-wc", WebCounter);
}
