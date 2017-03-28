import interact = require("interact.js");

const enum Layout {
  Horizontal,
  Vertical
};

const dockAreas = ["center", "left", "right", "top", "bottom"];

export class DashboardPanel {
  rootElement: HTMLElement;
  dockerElement: HTMLElement; // container to drop element
  indicatorElement: HTMLElement; // container of indicators to tell which area to drop
  canDrag: boolean;
  canDrop: boolean;
  layout: Layout;
  parentPanel: DashboardPanel;

  constructor(element: HTMLElement, canDrag = true, canDrop = true) {
    this.rootElement = element;
    (<any>this.rootElement).dashboardPanel = this;
    this.canDrag = canDrag;
    this.canDrop = canDrop;
    this.layout = Layout.Horizontal;
    this._initPanel();
  }

  getElement(): HTMLElement {
    return this.rootElement;
  }

  private _initPanel() {
    if (!this.rootElement.classList.contains("dashboard-panel")) {
      this.rootElement.classList.add("dashboard-panel");
    }
    if (this.canDrag) {
      this._makeDraggable();
    }
    if (this.canDrop) {
      this._makeDroppable();
    }
  }

  private _makeDraggable() {
    if (!this.rootElement.classList.contains("dashboard-draggable")) {
      this.rootElement.classList.add("dashboard-draggable");
    }
    interact(this.rootElement).draggable({
      // enable inertial throwing
      inertia: true,
      // enable autoScroll
      autoScroll: true,
      // call this function on every dragmove event
      onmove: DashboardPanel.dragMoveListener,
      onstart: (event: Interact.InteractEvent) => {
        event.target.style.width = "100px";
        event.target.style.height = "100px";
      }
    });
  }

  private _makeDroppable() {
    if (!this.rootElement.classList.contains("dashboard-droppable")) {
      this.rootElement.classList.add("dashboard-droppable");
    }
    // make rootElement a area that can drop
    interact(this.rootElement).dropzone({
      accept: ".dashboard-draggable",
      ondragenter: (event: Interact.InteractEvent) => {
        event.target.classList.add("drop-active");
        this._setDefaultDropArea();
      },
      ondragleave: (event: Interact.InteractEvent) => {
        event.target.classList.remove("drop-active");
        this._clearDefaultDropArea();
      }
    });

    this.indicatorElement = document.createElement("div");
    this.indicatorElement.classList.add("indicator-area");
    this.rootElement.appendChild(this.indicatorElement);

    this.dockerElement = document.createElement("div");
    this.dockerElement.classList.add("docker-area");
    this.rootElement.appendChild(this.dockerElement);

    dockAreas.forEach(area => {
      this._makeDropZone(area);
    });
  }

  // default drop area is the first element of the array dropAreas
  private _setDefaultDropArea() {
    let target = this.indicatorElement.querySelector(".drop-target");
    if (!target) { // target is null if no result found
      this.indicatorElement.querySelector(".drop-indicator").classList.add("drop-target");
    }
  }

  private _clearDefaultDropArea() {
    const elements = this.indicatorElement.querySelectorAll(".drop-indicator");
    for (let i = 0; i < elements.length; i++) {
      elements[i].classList.remove("drop-target");
    }
  }

  private _makeDropZone(zone: string) {
    const element = document.createElement("div");
    element.classList.add("drop-indicator");
    element.classList.add(`${zone}-docker`);
    this.indicatorElement.appendChild(element);

    interact(element).dropzone({
      accept: ".dashboard-draggable",
      ondragenter: (event: Interact.InteractEvent) => {
        this._clearDefaultDropArea();
        const draggableElement = event.relatedTarget,
            dropzoneElement = event.target;
        // feedback the possibility of a drop
        dropzoneElement.classList.add("drop-target");
        draggableElement.classList.add("can-drop");
      },
      ondragleave: (event: Interact.InteractEvent) => {
        // remove the drop feedback style
        event.target.classList.remove("drop-target");
        event.relatedTarget.classList.remove("can-drop");
      },
      ondrop: (event: Interact.InteractEvent) => {
        event.relatedTarget.style.transform = "none";
        event.relatedTarget.style.left = "auto";
        event.relatedTarget.style.top = "auto";

        this._arrangeElement(event.relatedTarget, zone);
        this._clearDefaultDropArea();
      }
    });
  }

  private _arrangeElement(element: HTMLElement, zone: string) {
    const size = this.dockerElement.children.length;
    const previousParent = element.parentElement;

    if (size === 0) {
      element.style.width = "100%";
      element.style.height = "100%";
      this.dockerElement.appendChild(element);
      this.layout === Layout.Horizontal;
    } else {
      if (zone === "left") {
        this._prependHorizontally(element);
      } else if (zone === "right") {
        this._appendHorizontally(element);
      } else if (zone === "top") {
        this._prependVertically(element);
      } else if (zone === "bottom") {
        this._appendVertically(element);
      } else {
        this._setAsCentered(element);
      }
    }
    // Clear previousParent if there is nothing in it
    if (previousParent.children.length === 0) {
      previousParent.style.display = "none";
    }
  }

  private _prependHorizontally(element: HTMLElement) {
    const fragment = this._collectChildren();
    const otherElement = document.createElement("div");
    otherElement.classList.add("dashboard-panel");
    otherElement.appendChild(fragment);

    element.style.width = "50%";
    element.style.height = "100%";
    otherElement.style.width = "50%";
    otherElement.style.height = "100%";

    this.dockerElement.appendChild(element);
    this.dockerElement.appendChild(otherElement);
    this.layout = Layout.Horizontal;
    interact(element)
    .resizable({
      edges: { left: false, right: true, bottom: false, top: false }
    })
    .on("resizemove", DashboardPanel.resizeMoveListener);
    interact(otherElement)
    .resizable({
      edges: { left: true, right: false, bottom: false, top: false }
    })
    .on("resizemove", DashboardPanel.resizeMoveListener);
  }

  private _appendHorizontally(element: HTMLElement) {
    const fragment = this._collectChildren();
    const otherElement = document.createElement("div");
    otherElement.classList.add("dashboard-panel");
    otherElement.appendChild(fragment);

    element.style.width = "50%";
    element.style.height = "100%";
    otherElement.style.width = "50%";
    otherElement.style.height = "100%";

    this.dockerElement.appendChild(otherElement);
    this.dockerElement.appendChild(element);
    this.layout = Layout.Horizontal;
    interact(element)
    .resizable({
      edges: { left: true, right: false, bottom: false, top: false }
    })
    .on("resizemove", DashboardPanel.resizeMoveListener);
    interact(otherElement)
    .resizable({
      edges: { left: false, right: true, bottom: false, top: false }
    })
    .on("resizemove", DashboardPanel.resizeMoveListener);
  }

  private _prependVertically(element: HTMLElement) {
    const fragment = this._collectChildren();
    const otherElement = document.createElement("div");
    otherElement.classList.add("dashboard-panel");
    otherElement.appendChild(fragment);

    element.style.width = "100%";
    element.style.height = "50%";
    otherElement.style.width = "100%";
    otherElement.style.height = "50%";

    this.dockerElement.appendChild(element);
    this.dockerElement.appendChild(otherElement);
    this.layout = Layout.Vertical;
    interact(element)
    .resizable({
      edges: { left: false, right: false, bottom: true, top: false }
    })
    .on("resizemove", DashboardPanel.resizeMoveListener);
    interact(otherElement)
    .resizable({
      edges: { left: false, right: false, bottom: false, top: true }
    })
    .on("resizemove", DashboardPanel.resizeMoveListener);
  }

  private _appendVertically(element: HTMLElement) {
    const fragment = this._collectChildren();
    const otherElement = document.createElement("div");
    otherElement.classList.add("dashboard-panel");
    otherElement.appendChild(fragment);

    element.style.width = "100%";
    element.style.height = "50%";
    otherElement.style.width = "100%";
    otherElement.style.height = "50%";

    this.dockerElement.appendChild(otherElement);
    this.dockerElement.appendChild(element);
    this.layout = Layout.Vertical;
    interact(element)
    .resizable({
      edges: { left: false, right: false, bottom: false, top: true }
    })
    .on("resizemove", DashboardPanel.resizeMoveListener);
    interact(otherElement)
    .resizable({
      edges: { left: false, right: false, bottom: true, top: false }
    })
    .on("resizemove", DashboardPanel.resizeMoveListener);
  }

  private _setAsCentered(element: HTMLElement) {
    const children = this.dockerElement.children;
    const half = Math.floor(children.length / 2);
    const fragment1 = document.createDocumentFragment(),
      fragment2 = document.createDocumentFragment();
    let i = 0;
    while (i < half) {
      fragment1.appendChild(this.dockerElement.children[0]);
      i++;
    }
    while (this.dockerElement.children.length > 0) {
      fragment2.appendChild(this.dockerElement.children[0]);
    }
    let width, height;
    if (this.layout === Layout.Horizontal) {
      width = 50;
      height = 100;
      if (fragment1.children.length > 0) {
        width = 33.3;
      }
    } else {
      width = 100;
      height = 50;
      if (fragment1.children.length > 0) {
        height = 33.3;
      }
    }
    if (fragment1.children.length > 0) {
      const elem1 = document.createElement("div");
      elem1.classList.add("dashboard-panel");
      elem1.appendChild(fragment1);
      elem1.style.width = "${width}%";
      elem1.style.height = "${height}%";
      this.dockerElement.appendChild(elem1);
    }
    element.style.width = "${width}%";
    element.style.height = "${height}%";
    this.dockerElement.appendChild(element);
    const elem2 = document.createElement("div");
    elem2.classList.add("dashboard-panel");
    elem2.appendChild(fragment1);
    elem2.style.width = "${width}%";
    elem2.style.height = "${height}%";
    this.dockerElement.appendChild(elem2);
  }

  private _collectChildren(): DocumentFragment {
    const children = this.dockerElement.children;
    if (children.length <= 0) {
      return null;
    }
    const fragment = document.createDocumentFragment();
    while (this.dockerElement.children.length > 0) {
      fragment.appendChild(this.dockerElement.children[0]);
    }
    return fragment;
  }

  private static dragMoveListener(event: Interact.InteractEvent) {
    const target = event.target,
        // keep the dragged position in the data-x/data-y attributes
        x = (parseFloat(target.getAttribute("data-x")) || 0) + event.dx,
        y = (parseFloat(target.getAttribute("data-y")) || 0) + event.dy;

    // translate the element
    target.style.webkitTransform =
      target.style.transform = `translate(${x}px, ${y}px)`;

    // update the posiion attributes
    target.setAttribute("data-x", x);
    target.setAttribute("data-y", y);
  }

  // private static resizeMoveListener(event: Interact.InteractEvent) {
  //   let target = event.target,
  //       x = (parseFloat(target.getAttribute("data-x")) || 0),
  //       y = (parseFloat(target.getAttribute("data-y")) || 0);

  //   // update the element's style
  //   target.style.width  = event.rect.width + "px";
  //   target.style.height = event.rect.height + "px";

  //   // translate when resizing from top or left edges
  //   x += event.deltaRect.left;
  //   y += event.deltaRect.top;

  //   target.style.webkitTransform = target.style.transform =
  //       "translate(" + x + "px," + y + "px)";

  //   target.setAttribute("data-x", x);
  //   target.setAttribute("data-y", y);
  // }
}
