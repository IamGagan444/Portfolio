import { getBlogPosts, getPost } from "@/data/blog";
import { getProfile } from "@/lib/data/portfolio";
import { absoluteUrl, jsonLd } from "@/lib/site";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type Props = { params: Promise<{ slug: string }> };

async function loadPost(slug: string) {
  // Only serve slugs that exist in /content; prevents path probing via the slug.
  const posts = await getBlogPosts();
  return posts.find((post) => post.slug === slug) ? getPost(slug) : null;
}

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata | undefined> {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) return undefined;

  const {
    title,
    publishedAt: publishedTime,
    summary: description,
    image,
  } = post.metadata;
  const ogImage = image ? absoluteUrl(image) : undefined;

  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime,
      url: absoluteUrl(`/blog/${post.slug}`),
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function Blog({ params }: Props) {
  const { slug } = await params;
  const [post, profile] = await Promise.all([loadPost(slug), getProfile()]);

  if (!post) {
    notFound();
  }

  return (
    <section id="blog">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.metadata.title,
            datePublished: post.metadata.publishedAt,
            dateModified: post.metadata.publishedAt,
            description: post.metadata.summary,
            image: post.metadata.image ? absoluteUrl(post.metadata.image) : undefined,
            url: absoluteUrl(`/blog/${post.slug}`),
            author: profile ? { "@type": "Person", name: profile.name } : undefined,
          }),
        }}
      />
      <h1 className="title font-medium text-2xl tracking-tighter max-w-[650px]">
        {post.metadata.title}
      </h1>
      <div className="flex justify-between items-center mt-2 mb-8 text-sm max-w-[650px]">
        <Suspense fallback={<p className="h-5" />}>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {formatDate(post.metadata.publishedAt)}
          </p>
        </Suspense>
      </div>
      <article
        className="prose dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: post.source }}
      ></article>
    </section>
  );
}
