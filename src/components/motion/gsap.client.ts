import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";

let registered = false;
if (!registered) {
  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, MotionPathPlugin, MorphSVGPlugin);
  gsap.defaults({ ease: "power3.out", duration: 1.0 });
  registered = true;
}

export { gsap, ScrollTrigger, SplitText, DrawSVGPlugin, MotionPathPlugin, MorphSVGPlugin };
