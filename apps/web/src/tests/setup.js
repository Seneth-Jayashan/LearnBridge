// Polyfill for React Router DOM v7 in jsdom
const { TextEncoder, TextDecoder } = require("util");
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import "@testing-library/jest-dom";

const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === "string" && args[0].includes("act(")) return;
    originalError.call(console, ...args);
  };
});
afterAll(() => { console.error = originalError; });

Object.defineProperty(window, "confirm", { writable: true, value: jest.fn(() => true) });
window.scrollTo = jest.fn();