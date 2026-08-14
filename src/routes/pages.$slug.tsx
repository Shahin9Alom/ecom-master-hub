import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { StoreLayout } from "@/components/store/StoreLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useContentSettings, useStoreSettings } from "@/lib/data";

const TITLES: Record<string, string> = {
  about: "About us",
  contact: "Contact us",
  faq: "Frequently asked questions",
  shipping: "Shipping information",
  returns: "Return policy",
  privacy: "Privacy policy",
  terms: "Terms & conditions",
};

export const Route = createFileRoute("/pages/$slug")({
  head: ({ params }) => {
    const title = TITLES[params.slug] ?? "Information";
    return {
      meta: [
        { title: `${title} — Shahin Mart` },
        { name: "description", content: `${title} for Shahin Mart customers.` },
        { property: "og:title", content: `${title} — Shahin Mart` },
        { property: "og:description", content: `${title} for Shahin Mart customers.` },
      ],
    };
  },
  component: ContentPage,
});

function ContentPage() {
  const { slug } = Route.useParams();
  const { data: content } = useContentSettings();
  const { data: store } = useStoreSettings();
  const title = TITLES[slug] ?? "Information";

  const text =
    slug === "about"
      ? content?.about
      : slug === "shipping"
        ? content?.shipping_info
        : slug === "returns"
          ? content?.return_policy
          : slug === "privacy"
            ? content?.privacy_policy
            : slug === "terms"
              ? content?.terms
              : null;

  return (
    <StoreLayout>
      <div className="container-page max-w-3xl py-12">
        <h1 className="text-3xl font-bold">{title}</h1>

        {slug === "faq" ? (
          <Accordion type="single" collapsible className="mt-6">
            {(content?.faq ?? []).map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent>{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : slug === "contact" ? (
          <div className="mt-6 space-y-3 rounded-xl border bg-card p-6 text-sm">
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" /> {store?.phone}
            </p>
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" /> {store?.email}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> {store?.address}
            </p>
            <p className="pt-2 text-muted-foreground">
              Our support team replies within one business day.
            </p>
          </div>
        ) : (
          <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {text ?? "This page has not been filled in yet."}
          </p>
        )}
      </div>
    </StoreLayout>
  );
}
