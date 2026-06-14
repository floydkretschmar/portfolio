import { describe, expect, it, vi } from "vitest";

import config from "../../../config.js";
import { createFlickrClient } from "../../../src/services/flickr-client.js";

describe("Flickr client", () => {
  it("requests the configured Flickr photoset page and returns gallery data", async () => {
    const responseBody = { data: [{ id: "photo-1" }], totalPages: 7 };
    const fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(responseBody),
      ok: true,
    });

    const result = await createFlickrClient({ config, fetch }).fetchPage(3, 25);

    expect(result).toEqual({ data: responseBody });
    expect(fetch).toHaveBeenCalledWith(
      `${config.service_base_url}/photos/${config.photoset}?page=3&limit=25`,
    );
  });

  it("propagates Flickr request and JSON parsing failures", async () => {
    await expect(
      createFlickrClient({
        config,
        fetch: vi.fn().mockResolvedValue({ ok: false, status: 503 }),
      }).fetchPage(1, 20),
    ).rejects.toThrow("Flickr request failed with status 503");

    const invalidJson = new SyntaxError("Unexpected token");
    await expect(
      createFlickrClient({
        config,
        fetch: vi.fn().mockResolvedValue({
          json: () => Promise.reject(invalidJson),
          ok: true,
        }),
      }).fetchPage(1, 20),
    ).rejects.toBe(invalidJson);
  });

  it("fails clearly when fetch is not provided", () => {
    expect(() => createFlickrClient({ config })).toThrow(
      "Flickr client requires a fetch function",
    );
  });
});
