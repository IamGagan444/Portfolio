import { Container } from "@/components/portfolio/section";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="pb-24 pt-32 sm:pt-40">
      <Container className="max-w-2xl">{children}</Container>
    </main>
  );
}
