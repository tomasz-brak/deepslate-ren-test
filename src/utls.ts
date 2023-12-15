import { mat4, vec3 } from "gl-matrix";

const document = window.document;

class InteractiveCanvas {
  private xRotation = 0.8;
  private yRotation = 0.5;
  private camera_pos: vec3 = vec3.fromValues(0, 0, 0);

  private movement = [0, 0, 0, 0, 0, 0];
  private movmentKeys = ["w", "a", "s", "d", " ", "Shift"];

  private view: mat4 = mat4.create();

  constructor(
    private canvas: HTMLCanvasElement,
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

    document.addEventListener("keydown", (evt) => {
      const index = this.movmentKeys.indexOf(evt.key);
      if (index !== -1) {
        this.movement[index] = 1;
        this.redraw();
      }
    });

    document.addEventListener("keyup", (evt) => {
      const index = this.movmentKeys.indexOf(evt.key);
      if (index !== -1) {
        this.movement[index] = 0;
        this.redraw();
      }
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

    this.view = mat4.create();
    mat4.translate(this.view, this.view, [0, 0, -this.viewDist]);
    mat4.rotate(this.view, this.view, this.xRotation, [1, 0, 0]);
    mat4.rotate(this.view, this.view, this.yRotation, [0, 1, 0]);

    mat4.translate(this.view, this.view, this.camera_pos);

    if (this.movement.some((m) => m)) {
      vec3.rotateY(this.camera_pos, this.camera_pos, [0, 0, 0], this.yRotation);
      const [w, a, s, d, space, shift] = this.movement;
      const move = vec3.fromValues(a - d, shift - space, w - s);
      console.log(move);
      vec3.scaleAndAdd(this.camera_pos, this.camera_pos, move, 0.04);
      vec3.rotateY(
        this.camera_pos,
        this.camera_pos,
        [0, 0, 0],
        -this.yRotation
      );
      console.log(`X ROT: ${this.xRotation} Y ROT: ${this.yRotation}`);
    }

    if (this.center) {
      mat4.translate(this.view, this.view, [
        -this.center[0],
        -this.center[1],
        -this.center[2],
      ]);
    }

    this.onRender(this.view);
  }
  public resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }
}
export { InteractiveCanvas };
