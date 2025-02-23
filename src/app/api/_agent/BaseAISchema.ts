export const requirement_list_schema = {
  name: "requirement_list",
  strict: true,
  schema: {
    type: "object",
    properties: {
      requirements: {
        type: "array",
        items: {
          type: "string",
        },
      },
    },
    required: ["requirements"],
    additionalProperties: false,
  },
};