import { CHURCHES } from "@/lib/churches";
import ChurchSearch from "./ChurchSearch";

export const metadata = {
  title: "Find your church",
};

export default function FindChurchPage() {
  return (
    <section className="churches-page">
      <h1>Find your church</h1>
      <p className="lead">Search for your church, then give online, by text, or by scanning its QR code.</p>
      <ChurchSearch churches={CHURCHES} />
    </section>
  );
}
