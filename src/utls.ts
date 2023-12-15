import { mat4 } from "gl-matrix";

class InteractiveCanvas {
  private xRotation = 0.8;
  private yRotation = 0.5;

  constructor(
    canvas: HTMLCanvasElement,
    private readonly onRender: (view: mat4) => void,
    private readonly center?: [number, number, number],
    private viewDist = 4
  ) {
    let dragPos: null | [number, number] = null;
    canvas.addEventListener("mousedown", (evt) => {
      if (evt.button === 0) {
        dragPos = [evt.clientX, evt.clientY];
      }
    });
    canvas.addEventListener("mousemove", (evt) => {
      if (dragPos) {
        this.yRotation += (evt.clientX - dragPos[0]) / 100;
        this.xRotation += (evt.clientY - dragPos[1]) / 100;
        dragPos = [evt.clientX, evt.clientY];
        this.redraw();
      }
    });
    canvas.addEventListener("mouseup", () => {
      dragPos = null;
    });
    canvas.addEventListener("wheel", (evt) => {
      evt.preventDefault();
      this.viewDist += evt.deltaY / 100;
      this.redraw();
    });

    this.redraw();
  }

  public redraw() {
    requestAnimationFrame(() => this.renderImmediately());
  }

  private renderImmediately() {
    this.yRotation = this.yRotation % (Math.PI * 2);
    this.xRotation = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, this.xRotation)
    );
    this.viewDist = Math.max(1, this.viewDist);

    const view = mat4.create();
    mat4.translate(view, view, [0, 0, -this.viewDist]);
    mat4.rotate(view, view, this.xRotation, [1, 0, 0]);
    mat4.rotate(view, view, this.yRotation, [0, 1, 0]);
    if (this.center) {
      mat4.translate(view, view, [
        -this.center[0],
        -this.center[1],
        -this.center[2],
      ]);
    }

    this.onRender(view);
  }
}
export { InteractiveCanvas };
