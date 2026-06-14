import { describe, expect, it, vi } from "vitest";

import config from "../../../config.js";
import ApiService from "../../../src/services/ApiService.ts";

const axios = vi.hoisted(() => vi.fn());

vi.mock("axios", () => ({
  default: axios,
}));

describe("ApiService", () => {
  it("requests the configured Flickr photoset page", () => {
    axios.mockReturnValue({ data: [] });

    const result = new ApiService().fetchItemsAPI(3, 25);

    expect(result).toEqual({ data: [] });
    expect(axios).toHaveBeenCalledWith({
      method: "get",
      params: {
        limit: 25,
        page: 3,
      },
      url: `${config.service_base_url}/photos/${config.photoset}`,
    });
  });
});
