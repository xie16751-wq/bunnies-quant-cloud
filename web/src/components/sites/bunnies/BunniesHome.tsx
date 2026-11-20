import "./page.css";
import "./extras.css";
import "./bunnies.css";
import { Stage } from "./Stage";
import { Behaviors } from "./Behaviors";
import { Header } from "./sections/Header";
import { Hero } from "./sections/Hero";
import { Product } from "./sections/Product";
import { Partners } from "./sections/Partners";
import { Features } from "./sections/Features";
import { KeyFeatures } from "./sections/KeyFeatures";
import { Services } from "./sections/Services";
import { Benefits } from "./sections/Benefits";
import { Testimonials } from "./sections/Testimonials";
import { Pricing } from "./sections/Pricing";
import { Footer } from "./sections/Footer";

/** Anchor markers: their positions map scroll to the 3D timeline (see timeline.ts). */
function Anchor({ id }: { id: string }) {
  return <div className="pwb-anchor" id={id} />;
}

export function BunniesHome() {
  return (
    <div id="i6mb" className="fof">
      <Stage />
      <Behaviors />
      <div className="fof-content">
        <Header />
        <Anchor id="i3owk" />
        <Hero />
        <Product />
        <Partners />
        <Anchor id="i3owk-2-3" />
        <Features />
        <KeyFeatures />
        <Anchor id="i3owk-2-2-3-2" />
        <Services />
        <Benefits />
        <Anchor id="i3owk-2-2-3" />
        <Testimonials />
        <Pricing />
        <Anchor id="i3owk-2-2-2" />
        <Footer />
        <Anchor id="i3owk-2-2-2-2" />
      </div>
    </div>
  );
}
