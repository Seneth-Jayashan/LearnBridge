import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// 🔧 Mock Express response object
const createRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe("LevelController", () => {
  let createLevel;
  let getLevelById;
  let getAllLevels;

  // 📦 Mock Level model
  let LevelMock;

  // 🔧 Mock save() method (used in new Level())
  let saveMock;

  beforeEach(async () => {
    // 🔄 Reset modules before each test
    jest.resetModules();

    // Mock save() → simulate DB save success
    saveMock = jest.fn().mockResolvedValue(undefined);

    // Mock constructor (new Level())
    LevelMock = jest.fn().mockImplementation((payload) => ({
      ...payload,
      save: saveMock,
    }));

    // Mock static methods
    LevelMock.find = jest.fn();
    LevelMock.findById = jest.fn();
    LevelMock.findOne = jest.fn();
    LevelMock.create = jest.fn();
    LevelMock.findByIdAndUpdate = jest.fn();
    LevelMock.findByIdAndDelete = jest.fn();

    // 🔌 Inject mock into module
    await jest.unstable_mockModule("../../models/Level.js", () => ({
      default: LevelMock,
    }));

    // 📥 Import controller AFTER mocks
    ({ createLevel, getLevelById, getAllLevels } = await import(
      "../../controllers/LevelController.js"
    ));
  });

  // ✅ POSITIVE TEST
  // ✔ Tests successful level creation
  it("returns 201 when level is created", async () => {
    // Mock: no duplicate level exists
    LevelMock.findOne.mockResolvedValue(null);

    const req = {
      body: {
        name: "Primary Education",
        description: "Grade 1-5",
      },
    };
    const res = createRes();

    await createLevel(req, res);

    // ✔ Ensure save() is called
    expect(saveMock).toHaveBeenCalled();

    // ✔ Expect success response
    expect(res.status).toHaveBeenCalledWith(201);
  });

  // ❌ NEGATIVE TEST
  // ✔ Tests validation when name is missing
  it("returns 400 when required name is missing", async () => {
    const req = {
      body: { description: "No name" },
    };
    const res = createRes();

    await createLevel(req, res);

    // ✔ Expect BAD REQUEST
    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      message: "Level name is required",
    });
  });

  // ❌ NEGATIVE TEST
  // ✔ Tests fetching level by ID when not found
  it("returns 404 when level is not found", async () => {
    // Mock: level not found
    LevelMock.findById.mockResolvedValue(null);

    const req = {
      params: { id: "level-1" },
    };
    const res = createRes();

    await getLevelById(req, res);

    // ✔ Expect NOT FOUND
    expect(res.status).toHaveBeenCalledWith(404);

    expect(res.json).toHaveBeenCalledWith({
      message: "Level not found",
    });
  });

  // ❌ NEGATIVE TEST (SERVER ERROR)
  // ✔ Tests database failure when fetching all levels
  it("returns 500 on database error", async () => {
    // Mock: DB throws error
    LevelMock.find.mockImplementation(() => {
      throw new Error("db failed");
    });

    const req = {};
    const res = createRes();

    await getAllLevels(req, res);

    // ✔ Expect INTERNAL SERVER ERROR
    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Server error",
      })
    );
  });
});