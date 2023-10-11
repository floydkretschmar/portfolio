import axios from "axios";
import config from "../../config";

export default class ApiService {
  constructor() {}

  fetchItemsAPI(pageNumber, pageCount) {
    return axios({
      method: "get",
      url: `${config.service_base_url}/photos/${config.photoset}`,
      params: {
        page: pageNumber,
        limit: pageCount,
      },
    });
  }
}
