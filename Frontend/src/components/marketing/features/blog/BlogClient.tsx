"use client";

import React, { useState } from "react";
import { FiSearch, FiBookOpen, FiClock, FiArrowRight } from "react-icons/fi";
import Link from "next/link";
import styles from "./BlogClient.module.css";

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  publishedAt: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  featured?: boolean;
  tags: string[];
}

export const BLOG_POSTS: BlogPost[] = [];

const GENERIC_CATEGORIES = [
  "All",
  "Technology",
  "Finance",
  "Productivity",
  "Lifestyle",
  "Guides",
  "General",
] as const;

export default function BlogClient() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredPosts = BLOG_POSTS.filter((post) => {
    const matchesCategory =
      selectedCategory === "All" ||
      post.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const featuredPost = filteredPosts.find((p) => p.featured) || filteredPosts[0];

  return (
    <main className={styles.blogCanvas}>
      <div className={styles.ambientAuraTop} aria-hidden="true" />
      <div className={styles.ambientAuraBottom} aria-hidden="true" />

      <div className={styles.blogContainer}>
        {/* HEADER SECTION */}
        <header className={styles.blogHeader}>
          <div className={styles.badgePill}>
            <span className={styles.badgeDot} />
            The Knowledge Hub
          </div>
          <h1 className={styles.blogTitle}>
            Articles, Guides, & <span className={styles.gradientText}>Fresh Perspectives</span>
          </h1>
          <p className={styles.blogSubtitle}>
            Explore our latest stories, tutorials, and insights across technology, productivity, and modern lifestyle.
          </p>

          {/* SEARCH & CATEGORY BAR */}
          <section className={styles.controlsToolbar} aria-label="Blog Search and Filters">
            <div className={styles.searchBox}>
              <FiSearch className={styles.searchIcon} size={18} aria-hidden="true" />
              <input
                type="search"
                placeholder="Search articles by title, topic, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
                aria-label="Search articles"
              />
            </div>

            <nav className={styles.categoryPillsRow} aria-label="Filter by category">
              {GENERIC_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`${styles.categoryBtn} ${
                    selectedCategory === cat ? styles.categoryBtnActive : ""
                  }`}
                  aria-pressed={selectedCategory === cat}
                >
                  {cat}
                </button>
              ))}
            </nav>
          </section>
        </header>

        {/* ARTICLES LISTING */}
        {filteredPosts.length > 0 ? (
          <>
            {selectedCategory === "All" && !searchQuery && featuredPost && (
              <article className={styles.featuredCard}>
                <div className={styles.featuredGlow} aria-hidden="true" />
                <div className={styles.featuredContent}>
                  <div className={styles.featuredMetaRow}>
                    <span className={styles.categoryBadge}>{featuredPost.category}</span>
                    <div className={styles.readTimeInfo}>
                      <FiClock size={14} aria-hidden="true" />
                      <span>{featuredPost.readTime}</span>
                    </div>
                  </div>

                  <h2 className={styles.featuredTitle}>
                    <Link href={`/blog/${featuredPost.slug}`}>{featuredPost.title}</Link>
                  </h2>
                  <p className={styles.featuredExcerpt}>{featuredPost.excerpt}</p>

                  <div className={styles.cardFooter}>
                    <div className={styles.authorMeta}>
                      <span className={styles.authorAvatar} aria-hidden="true">
                        {featuredPost.author.avatar}
                      </span>
                      <div className={styles.authorInfo}>
                        <strong>{featuredPost.author.name}</strong>
                        <span>{featuredPost.author.role}</span>
                      </div>
                    </div>

                    <Link href={`/blog/${featuredPost.slug}`} className={styles.readArticleLink}>
                      <span>Read Article</span>
                      <FiArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            )}

            <div className={styles.articlesGrid}>
              {filteredPosts.map((post) => {
                if (
                  selectedCategory === "All" &&
                  !searchQuery &&
                  post.slug === featuredPost?.slug
                ) {
                  return null;
                }

                return (
                  <article key={post.slug} className={styles.articleCard}>
                    <div className={styles.articleCardHeader}>
                      <span className={styles.categoryBadge}>{post.category}</span>
                      <div className={styles.readTimeInfo}>
                        <FiClock size={13} aria-hidden="true" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>

                    <div className={styles.articleCardBody}>
                      <h3 className={styles.articleCardTitle}>
                        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                      </h3>
                      <p className={styles.articleCardExcerpt}>{post.excerpt}</p>

                      <div className={styles.tagsFlex}>
                        {post.tags.map((t) => (
                          <span key={t} className={styles.tagPill}>
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className={styles.cardFooter}>
                      <div className={styles.authorMeta}>
                        <span className={styles.authorAvatar} aria-hidden="true">
                          {post.author.avatar}
                        </span>
                        <div className={styles.authorInfo}>
                          <strong>{post.author.name}</strong>
                          <time className={styles.publishDate}>{post.publishedAt}</time>
                        </div>
                      </div>

                      <Link
                        href={`/blog/${post.slug}`}
                        className={styles.cardArrowLink}
                        aria-label={`Read full article: ${post.title}`}
                      >
                        <FiArrowRight size={16} aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <section className={styles.emptyStateCard} aria-label="No articles available">
            <div className={styles.iconCircle} aria-hidden="true">
              <FiBookOpen size={30} />
            </div>
            <h2 className={styles.emptyTitle}>New Content Coming Soon</h2>
            <p className={styles.emptyDescription}>
              {searchQuery || selectedCategory !== "All"
                ? "No articles matched your search query or category filter."
                : "We are currently drafting new stories and tutorials. Check back soon for our latest publications."}
            </p>
            {(searchQuery || selectedCategory !== "All") && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("All");
                  setSearchQuery("");
                }}
                className={styles.resetFilterBtn}
              >
                Reset Search Filters
              </button>
            )}
          </section>
        )}
      </div>
    </main>
  );
}