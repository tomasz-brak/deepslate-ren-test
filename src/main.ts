import { init_renderer } from "./renderer";

console.log("Hello from main!");

const canvas = document.getElementById("display") as HTMLCanvasElement;

const large = init_renderer(canvas, "Medieval_Medium_House.litematic");

if (large) {
  canvas.innerText = "TOO LARGE OF A STRUCTURE TO RENDER";
}
