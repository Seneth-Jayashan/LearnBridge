import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// 🔧 Mock Express response object (res)
const createRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe("GradeController", () => {
  let createGrade;
  let getGradeById;
  let getAllGrades;

  // 📦 Mock Grade model
  let GradeMock;

  // 🔧 Mock save() function (used when creating new Grade)
  let saveMock;

  beforeEach(async () => {
    // 🔄 Reset modules before each test
    jest.resetModules();

    // Mock save() → simulates DB save success
    saveMock = jest.fn().mockResolvedValue(undefined);

    // Mock constructor for Grade model (new Grade())
    GradeMock = jest.fn().mockImplementation((payload) => ({
      ...payload,
      save: saveMock,
    }));

    // Mock static methods
    GradeMock.find = jest.fn();
    GradeMock.findById = jest.fn();
    GradeMock.findOne = jest.fn();
    GradeMock.create = jest.fn();
    GradeMock.findByIdAndUpdate = jest.fn();
    GradeMock.findByIdAndDelete = jest.fn();

    // 🔌 Inject mock into module
    await jest.unstable_mockModule("../../models/Grade.js", () => ({
      default: GradeMock,
    }));

    // 📥 Import controller AFTER mocks
    ({ createGrade, getGradeById, getAllGrades } = await import(
      "../../controllers/GradeController.js"
    ));
  });

  // ✅ POSITIVE TEST
  // ✔ Tests successful grade creation
  it("returns 201 when grade is created", async () => {
    // Mock: no duplicate grade exists
    GradeMock.findOne.mockResolvedValue(null);

    const req = {
      body: {
        name: " 6 ", // includes whitespace → should be trimmed to "6"
        description: "Grade six",
      },
    };
    const res = createRes();

    await createGrade(req, res);

    // ✔ Ensure duplicate check runs with trimmed name
    expect(GradeMock.findOne).toHaveBeenCalledWith({ name: "6" });

    // ✔ Ensure save() is called
    expect(saveMock).toHaveBeenCalled();

    // ✔ Expect success response
    expect(res.status).toHaveBeenCalledWith(201);
  });

  // ❌ NEGATIVE TEST
  // ✔ Tests validation when name is missing
  it("returns 400 when required name is missing", async () => {
    const req = {
      body: {
        description: "No name",
      },
    };
    const res = createRes();

    await createGrade(req, res);

    // ✔ Expect BAD REQUEST
    expect(res.status).toHaveBeenCalledWith(400);

    // ✔ Correct error message
    expect(res.json).toHaveBeenCalledWith({
      message: "Grade name is required",
    });
  });

  // ❌ NEGATIVE TEST
  // ✔ Tests fetching grade by ID when it does NOT exist
  it("returns 404 when grade is not found", async () => {
    // Mock: grade not found
    GradeMock.findById.mockResolvedValue(null);

    const req = {
      params: { id: "grade-1" },
    };
    const res = createRes();

    await getGradeById(req, res);

    // ✔ Expect NOT FOUND
    expect(res.status).toHaveBeenCalledWith(404);

    expect(res.json).toHaveBeenCalledWith({
      message: "Grade not found",
    });
  });

  // ❌ NEGATIVE TEST (SERVER ERROR)
  // ✔ Tests handling of database failure
  it("returns 500 on database error", async () => {
    // Mock: DB throws error
    GradeMock.find.mockImplementation(() => {
      throw new Error("db failed");
    });

    const req = {};
    const res = createRes();

    await getAllGrades(req, res);

    // ✔ Expect INTERNAL SERVER ERROR
    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Server error",
      })
    );
  });
});