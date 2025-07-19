
import { createJsonApiDataProvider } from "./jsonApiDataProvider";
export const dataProvider = createJsonApiDataProvider(
  import.meta.env.VITE_JSON_SERVER_URL,
);
