/**
 * Linkding API Client
 * Handles all interactions with the Linkding REST API
 */

import { config } from "./config";

export interface Bookmark {
  id: number;
  url: string;
  title: string;
  description: string;
  notes: string;
  web_archive_snapshot_url: string | null;
  favicon_url: string | null;
  preview_image_url: string | null;
  is_archived: boolean;
  unread: boolean;
  shared: boolean;
  tag_names: string[];
  date_added: string;
  date_modified: string;
}

export interface BookmarkListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Bookmark[];
}

export interface CreateBookmarkPayload {
  url: string;
  title?: string;
  description?: string;
  notes?: string;
  is_archived?: boolean;
  unread?: boolean;
  shared?: boolean;
  tag_names?: string[];
}

export interface CheckBookmarkResponse {
  bookmark: Bookmark | null;
  metadata: {
    title: string;
    description: string;
  };
  auto_tags: string[];
}

export interface Tag {
  id: number;
  name: string;
  date_added: string;
}

export interface TagListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Tag[];
}

class LinkdingClient {
  private baseUrl: string;
  private apiToken: string;

  constructor() {
    this.baseUrl = config.linkding.url;
    this.apiToken = config.linkding.apiToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`;
    const headers = {
      Authorization: `Token ${this.apiToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Linkding API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    // Handle empty responses (like DELETE)
    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text) as T;
  }

  /**
   * Check if a URL is already bookmarked
   */
  async checkBookmark(url: string): Promise<CheckBookmarkResponse> {
    const encodedUrl = encodeURIComponent(url);
    return this.request<CheckBookmarkResponse>(
      `/bookmarks/check/?url=${encodedUrl}`
    );
  }

  /**
   * Create a new bookmark
   */
  async createBookmark(payload: CreateBookmarkPayload): Promise<Bookmark> {
    return this.request<Bookmark>("/bookmarks/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Get a bookmark by ID
   */
  async getBookmark(id: number): Promise<Bookmark> {
    return this.request<Bookmark>(`/bookmarks/${id}/`);
  }

  /**
   * List bookmarks with optional search query
   */
  async listBookmarks(params?: {
    q?: string;
    limit?: number;
    offset?: number;
  }): Promise<BookmarkListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.set("q", params.q);
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.offset) searchParams.set("offset", params.offset.toString());

    const query = searchParams.toString();
    return this.request<BookmarkListResponse>(
      `/bookmarks/${query ? `?${query}` : ""}`
    );
  }

  /**
   * Delete a bookmark by ID
   */
  async deleteBookmark(id: number): Promise<void> {
    await this.request(`/bookmarks/${id}/`, {
      method: "DELETE",
    });
  }

  /**
   * Archive a bookmark
   */
  async archiveBookmark(id: number): Promise<void> {
    await this.request(`/bookmarks/${id}/archive/`, {
      method: "POST",
    });
  }

  /**
   * Unarchive a bookmark
   */
  async unarchiveBookmark(id: number): Promise<void> {
    await this.request(`/bookmarks/${id}/unarchive/`, {
      method: "POST",
    });
  }

  /**
   * Update a bookmark
   */
  async updateBookmark(
    id: number,
    payload: Partial<CreateBookmarkPayload>
  ): Promise<Bookmark> {
    return this.request<Bookmark>(`/bookmarks/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  /**
   * List all tags
   */
  async listTags(params?: {
    limit?: number;
    offset?: number;
  }): Promise<TagListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.offset) searchParams.set("offset", params.offset.toString());

    const query = searchParams.toString();
    return this.request<TagListResponse>(`/tags/${query ? `?${query}` : ""}`);
  }

  /**
   * Test the connection to Linkding
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.listBookmarks({ limit: 1 });
      return true;
    } catch {
      return false;
    }
  }
}

// Export a singleton instance
export const linkding = new LinkdingClient();

