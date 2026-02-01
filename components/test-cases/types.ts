export type Branch = {
  id: string;
  name: string;
  slug: string;
  createdAt: number; // 👈 for newest-first sorting
};
