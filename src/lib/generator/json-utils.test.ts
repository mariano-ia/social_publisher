import { describe, it, expect } from "vitest";
import { extractJson, stripEmojisDeep } from "./json-utils";

describe("extractJson", () => {
  it("parses plain JSON", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it("strips markdown fences", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("slices from first { to last } when surrounded by prose", () => {
    expect(extractJson('Sure! {"a":1} done')).toEqual({ a: 1 });
  });

  it("repairs trailing commas via jsonrepair", () => {
    expect(extractJson('{"a":1,}')).toEqual({ a: 1 });
  });

  it("throws when there is no JSON object", () => {
    expect(() => extractJson("no json here")).toThrow();
  });
});

describe("stripEmojisDeep", () => {
  it("removes emojis from strings", () => {
    expect(stripEmojisDeep("hola 👋 mundo")).toBe("hola mundo");
  });

  it("recurses into arrays and objects", () => {
    expect(stripEmojisDeep({ t: "a ✨", xs: ["b 🚀"] })).toEqual({ t: "a", xs: ["b"] });
  });

  it("leaves non-strings untouched", () => {
    expect(stripEmojisDeep(42)).toBe(42);
  });
});
