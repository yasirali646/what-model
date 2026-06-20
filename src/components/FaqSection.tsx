import { faqItems } from "@/lib/seo/site";

export function FaqSection() {
  return (
    <section id="faq" className="faq-section scroll-mt-8" aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="section-title">
        <span>03</span> / FAQ
      </h2>
      <dl className="faq-list">
        {faqItems.map((item) => (
          <div key={item.question} className="faq-item">
            <dt className="faq-question">{item.question}</dt>
            <dd className="faq-answer">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
