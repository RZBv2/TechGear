import { Footer, Header, MobileDrawer } from "@/components/techgear/Sections";

type Section = { title: string; body: string };
export function InfoPage({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: Section[];
}) {
  return (
    <>
      <Header />
      <MobileDrawer />
      <main className="section section--below-header">
        <div className="container">
          <header className="section-head">
            <span className="eyebrow">{eyebrow}</span>
            <h1 className="section-title">{title}</h1>
            <p className="section-lead">{intro}</p>
          </header>
          <div className="info-page">
            {sections.map((section) => (
              <section className="panel info-page__section" key={section.title}>
                <h2
                  className="section-title"
                  style={{ fontSize: "var(--step-1)" }}
                >
                  {section.title}
                </h2>
                <p className="section-lead">{section.body}</p>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
