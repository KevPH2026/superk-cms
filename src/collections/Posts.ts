import { CollectionConfig } from "payload";

export const Posts: CollectionConfig = {
  slug: "posts",
  admin: {
    defaultColumns: ["title", "status", "publishedAt"],
    useAsTitle: "title",
    description: "Manage blog posts for superk.ai",
    pagination: {
      defaultLimit: 20,
    },
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Auto-generate slug from title if not provided
        if (data.title && !data.slug) {
          data.slug = data.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: "title",
      label: "Title (English)",
      type: "text",
      required: true,
      admin: {
        description: "Post title in English",
      },
    },
    {
      name: "titleZh",
      label: "标题（中文）",
      type: "text",
      required: false,
      admin: {
        description: "中文标题",
      },
    },
    {
      name: "slug",
      label: "Slug",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description: "URL slug (auto-generated from title)",
      },
    },
    {
      name: "excerpt",
      label: "Excerpt / 摘要",
      type: "textarea",
      required: false,
      admin: {
        description: "Short summary for article cards",
      },
    },
    {
      name: "content",
      label: "Content (English)",
      type: "richText",
      required: false,
      admin: {
        description: "Main article content in English",
      },
    },
    {
      name: "contentZh",
      label: "内容（中文）",
      type: "richText",
      required: false,
      admin: {
        description: "中文文章内容",
      },
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
      defaultValue: "draft",
      required: true,
      admin: {
        description: "Only published posts appear on the site",
      },
    },
    {
      name: "publishedAt",
      label: "Published At",
      type: "date",
      required: false,
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
    {
      name: "category",
      label: "Category / 分类",
      type: "select",
      required: false,
      options: [
        { label: "AI & Technology", value: "ai-tech" },
        { label: "Business & Growth", value: "business" },
        { label: "Cross-border E-commerce", value: "ecommerce" },
        { label: "Personal Growth", value: "growth" },
        { label: "Thoughts", value: "thoughts" },
      ],
    },
    {
      name: "tags",
      label: "Tags / 标签",
      type: "text",
      required: false,
      admin: {
        description: "Comma-separated tags",
      },
    },
  ],
};
