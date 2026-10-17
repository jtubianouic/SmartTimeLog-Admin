const errorSchema = {
  type: "object",
  required: ["ok", "message"],
  properties: {
    ok: { type: "boolean", const: false },
    message: { type: "string" },
  },
} as const;

const locationSchema = {
  type: "object",
  required: ["lat", "long"],
  properties: {
    lat: { type: "number", minimum: -90, maximum: 90, example: 7.0731 },
    long: { type: "number", minimum: -180, maximum: 180, example: 125.6128 },
  },
} as const;

const attendanceResponses = {
  "201": {
    description: "Attendance event recorded.",
    content: { "application/json": { schema: { $ref: "#/components/schemas/AttendanceResponse" } } },
  },
  "400": { $ref: "#/components/responses/BadRequest" },
  "401": { $ref: "#/components/responses/Unauthorized" },
  "409": { $ref: "#/components/responses/Conflict" },
  "503": { $ref: "#/components/responses/Unavailable" },
} as const;

export const mobileOpenApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "SmartTimeLog API",
    version: "1.0.0",
    description:
      "Employee registration, authentication, attendance, break tracking, clock-out work input, and AI summaries. Send the login token as `Authorization: Bearer <token>` to protected mobile endpoints.",
  },
  servers: [{ url: "/", description: "Current SmartTimeLog deployment" }],
  tags: [
    { name: "Registration" },
    { name: "Authentication" },
    { name: "Attendance" },
    { name: "AI" },
  ],
  paths: {
    "/api/mobile/headquarters": {
      get: {
        tags: ["Registration"],
        summary: "List active headquarters for employee registration",
        description: "Public list containing only each active headquarters ID and name. No location coordinates or administrative fields are returned.",
        operationId: "listRegistrationHeadquarters",
        responses: {
          "200": {
            description: "Active headquarters, ordered by name.",
            content: { "application/json": { schema: {
              type: "array",
              items: { $ref: "#/components/schemas/HeadquartersOption" },
            } } },
          },
          "503": { $ref: "#/components/responses/Unavailable" },
        },
      },
    },
    "/api/admin/registration-qr": {
      get: {
        tags: ["Registration"],
        summary: "Get the current employee registration QR code",
        description: "Public endpoint. Returns a PNG data URL whose QR content is the current 30-minute registration token. Creates or rotates the singleton database token when needed. Registration still requires administrator approval before login.",
        operationId: "getRegistrationQr",
        responses: {
          "200": {
            description: "Current registration QR code and expiry.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/RegistrationQrResponse" } } },
          },
          "503": { $ref: "#/components/responses/Unavailable" },
        },
      },
    },
    "/api/mobile/register": {
      post: {
        tags: ["Registration"],
        summary: "Register an employee with a QR token",
        description: "Submit the 64-character token encoded in the administrator's QR code before its expiry. A successful registration creates a pending employee account. An administrator must approve it before the employee can log in.",
        operationId: "registerEmployee",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegistrationRequest" } } },
        },
        responses: {
          "201": {
            description: "Employee registration is pending administrator approval.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/RegistrationResponse" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "409": { $ref: "#/components/responses/Conflict" },
          "503": { $ref: "#/components/responses/Unavailable" },
        },
      },
    },
    "/api/mobile/login": {
      post: {
        tags: ["Authentication"],
        summary: "Authenticate employee",
        description: "Pending registrations cannot log in until an administrator approves the employee.",
        operationId: "loginEmployee",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Authenticated. The bearer token expires after 12 hours.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "413": { description: "Request body is too large." },
          "503": { $ref: "#/components/responses/Unavailable" },
        },
      },
    },
    "/api/mobile/clock-in": {
      post: {
        tags: ["Attendance"],
        summary: "Clock in",
        operationId: "clockIn",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/Location" } } },
        },
        responses: attendanceResponses,
      },
    },
    "/api/mobile/status": {
      get: {
        tags: ["Attendance"],
        summary: "Get today's attendance status",
        description: "Returns the employee's latest attendance state for the current UTC day and complete timelog history ordered newest first.",
        operationId: "getAttendanceStatus",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Current-day attendance status.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/StatusResponse" } } },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "503": { $ref: "#/components/responses/Unavailable" },
        },
      },
    },
    "/api/mobile/break": {
      post: {
        tags: ["Attendance"],
        summary: "Take a break",
        operationId: "takeBreak",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/Location" } } },
        },
        responses: attendanceResponses,
      },
    },
    "/api/mobile/break/end": {
      post: {
        tags: ["Attendance"],
        summary: "End the current break",
        operationId: "endBreak",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/Location" } } },
        },
        responses: attendanceResponses,
      },
    },
    "/api/mobile/clock-out": {
      post: {
        tags: ["Attendance"],
        summary: "Clock out and save work input and AI summary",
        operationId: "clockOut",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ClockOutRequest" } } },
        },
        responses: attendanceResponses,
      },
    },
    "/api/mobile/ai-summary": {
      post: {
        tags: ["AI"],
        summary: "Summarize employee work input",
        description: "Generates a summary from the supplied text without reading or writing clock-out records.",
        operationId: "summarizeEmployeeWork",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/SummaryRequest" } } },
        },
        responses: {
          "200": {
            description: "Summary generated. No data is persisted.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SummaryResponse" } } },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "503": { $ref: "#/components/responses/Unavailable" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Token returned by POST /api/mobile/login.",
      },
    },
    schemas: {
      HeadquartersOption: {
        type: "object",
        additionalProperties: false,
        required: ["hq_id", "hq_name"],
        properties: {
          hq_id: { type: "integer" },
          hq_name: { type: ["string", "null"] },
        },
      },
      RegistrationQrResponse: {
        type: "object",
        required: ["qrCode", "expiresAt"],
        properties: {
          qrCode: { type: "string", description: "PNG data URL containing the current registration token." },
          expiresAt: { type: "string", format: "date-time" },
        },
      },
      RegistrationRequest: {
        type: "object",
        additionalProperties: false,
        required: ["registrationToken", "firstName", "lastName", "username", "plainPassword", "headquartersId"],
        properties: {
          registrationToken: { type: "string", pattern: "^[0-9a-f]{64}$", description: "Raw token decoded from the QR code." },
          firstName: { type: "string", minLength: 1, maxLength: 80 },
          lastName: { type: "string", minLength: 1, maxLength: 80 },
          username: { type: "string", minLength: 3, maxLength: 80 },
          plainPassword: { type: "string", minLength: 8, maxLength: 128, format: "password" },
          headquartersId: { type: "integer", minimum: 1 },
        },
      },
      RegistrationResponse: {
        type: "object",
        required: ["ok", "isPending", "employee"],
        properties: {
          ok: { type: "boolean", const: true },
          isPending: { type: "boolean", const: true },
          employee: { $ref: "#/components/schemas/Employee" },
        },
      },
      LoginRequest: {
        type: "object",
        additionalProperties: false,
        required: ["username", "plainPassword"],
        properties: {
          username: { type: "string", minLength: 1, maxLength: 80 },
          plainPassword: { type: "string", minLength: 1, maxLength: 128, format: "password" },
        },
      },
      LoginResponse: {
        type: "object",
        required: ["ok", "accessToken", "tokenType", "expiresIn", "employee"],
        properties: {
          ok: { type: "boolean", const: true },
          accessToken: { type: "string" },
          tokenType: { type: "string", const: "Bearer" },
          expiresIn: { type: "integer", example: 43200 },
          employee: { $ref: "#/components/schemas/Employee" },
        },
      },
      Employee: {
        type: "object",
        required: ["employeeId", "username", "firstName", "lastName", "headquarters"],
        properties: {
          employeeId: { type: "integer" },
          username: { type: "string" },
          firstName: { type: ["string", "null"] },
          lastName: { type: ["string", "null"] },
          headquarters: { oneOf: [{ $ref: "#/components/schemas/Headquarters" }, { type: "null" }] },
        },
      },
      Headquarters: {
        type: "object",
        required: ["hq_id", "hq_name", "lat", "long"],
        properties: {
          hq_id: { type: "integer" },
          hq_name: { type: ["string", "null"] },
          lat: { type: "number" },
          long: { type: "number" },
        },
      },
      Location: locationSchema,
      ClockOutRequest: {
        ...locationSchema,
        required: ["lat", "long", "employeeInput", "aiSummary"],
        properties: {
          ...locationSchema.properties,
          employeeInput: { type: "string", minLength: 1, maxLength: 10000 },
          aiSummary: { type: "string", minLength: 1, maxLength: 2000 },
        },
      },
      Timelog: {
        type: "object",
        required: ["timelog_id", "employee_id", "log_type", "lat", "long", "timestamp"],
        properties: {
          timelog_id: { type: "integer" },
          employee_id: { type: ["integer", "null"] },
          log_type: { type: "string", enum: ["clock_in", "break", "break_end", "clock_out"] },
          lat: { type: "number" },
          long: { type: "number" },
          timestamp: { type: ["string", "null"], format: "date-time" },
        },
      },
      AttendanceResponse: {
        type: "object",
        required: ["ok", "timelog"],
        properties: {
          ok: { type: "boolean", const: true },
          timelog: { $ref: "#/components/schemas/Timelog" },
          clockOutLog: {
            type: "object",
            properties: {
              log_id: { type: "integer" },
              timelog_id: { type: ["integer", "null"] },
              employee_input: { type: ["string", "null"] },
              employee_ai_summary: { type: ["string", "null"] },
              created_at: { type: ["string", "null"], format: "date-time" },
            },
          },
        },
      },
      StatusResponse: {
        type: "object",
        required: [
          "ok",
          "date",
          "status",
          "clockedInDurationSeconds",
          "breakDurationSeconds",
          "currentBreakDurationSeconds",
          "latestTimelog",
          "timelogs",
        ],
        properties: {
          ok: { type: "boolean", const: true },
          date: { type: "string", format: "date", description: "Current UTC date." },
          status: {
            type: "string",
            enum: ["not_clocked_in", "clocked_in", "on_break", "clocked_out"],
          },
          clockedInDurationSeconds: {
            type: "integer",
            minimum: 0,
            description: "Gross seconds elapsed since clock-in, capped at clock-out.",
          },
          breakDurationSeconds: {
            type: "integer",
            minimum: 0,
            description: "Total seconds spent on breaks today, including an active break.",
          },
          currentBreakDurationSeconds: {
            type: "integer",
            minimum: 0,
            description: "Seconds elapsed in the active break, or zero when not on break.",
          },
          latestTimelog: {
            oneOf: [{ $ref: "#/components/schemas/Timelog" }, { type: "null" }],
          },
          timelogs: {
            type: "array",
            description: "The authenticated employee's complete timelog history, ordered newest first.",
            items: { $ref: "#/components/schemas/Timelog" },
          },
        },
      },
      SummaryRequest: {
        type: "object",
        additionalProperties: false,
        required: ["employeeInput"],
        properties: { employeeInput: { type: "string", minLength: 1, maxLength: 10000 } },
      },
      SummaryResponse: {
        type: "object",
        required: ["ok", "summary"],
        properties: {
          ok: { type: "boolean", const: true },
          summary: { type: "string", maxLength: 2000 },
        },
      },
      Error: errorSchema,
    },
    responses: {
      BadRequest: {
        description: "Malformed or invalid request.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      Unauthorized: {
        description: "Missing, expired, invalid, or revoked credentials.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      Conflict: {
        description: "The requested operation conflicts with existing data or state.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      Unavailable: {
        description: "The backing service is temporarily unavailable.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
    },
  },
} as const;
