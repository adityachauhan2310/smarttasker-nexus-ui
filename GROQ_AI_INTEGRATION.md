# Groq AI Integration Documentation

This document provides information about the Groq AI integration in SmartTasker, including features, API endpoints, example usage, and configuration.

## Overview

SmartTasker integrates with Groq AI to provide an intelligent chat assistant that can help with task management. The integration includes:

1. Natural language chat interface
2. Task creation from natural language
3. Smart task extraction
4. Contextual understanding of user data
5. Conversation memory
6. Feedback system for improving AI responses

## Configuration

The Groq AI integration is configured using environment variables:

```
GROQ_API_KEY=your_groq_api_key
GROQ_API_URL=https://api.groq.com/openai/v1
GROQ_MODEL=llama3-8b-8192
GROQ_MAX_TOKENS=4096
GROQ_TEMPERATURE=0.7
GROQ_TOP_P=0.9
GROQ_STREAMING=true
GROQ_RETRIES=3
GROQ_RETRY_DELAY_MS=1000
GROQ_TIMEOUT_MS=60000
GROQ_RATE_LIMIT_WINDOW_MS=60000
GROQ_RATE_LIMIT_MAX=20
GROQ_SYSTEM_PROMPT="You are SmartTasker AI, an intelligent assistant for task management."
```

See `SETUP_GUIDE.md` for detailed descriptions of these variables.

## API Endpoints

### Chat Endpoints

| Endpoint | Method | Description | Authentication |
|----------|--------|-------------|----------------|
| `/api/chat` | POST | Send a message to the AI assistant | Required |
| `/api/chat/history` | GET | Get chat history for user | Required |
| `/api/chat/history` | DELETE | Clear chat history | Required |
| `/api/chat/:id` | GET | Get a specific chat | Required |
| `/api/chat/:id` | DELETE | Delete a specific chat | Required |
| `/api/chat/feedback` | POST | Send feedback on AI response | Required |
| `/api/chat/:id/generate-title` | POST | Generate a title for a chat | Required |
| `/api/chat/extract-task` | POST | Extract task info from message | Required |

### Request/Response Examples

#### Send a Message

```http
POST /api/chat
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "message": "Schedule a meeting with John about the Q3 report tomorrow at 2pm",
  "chatId": "60d21b4667d0d8992e610c85", // Optional
  "stream": false // Set to true for streaming responses
}
```

Response:

```json
{
  "success": true,
  "data": {
    "response": "I've scheduled a meeting with John about the Q3 report for tomorrow at 2:00 PM. Would you like me to set a reminder for this meeting?"
  }
}
```

#### Extract Task

```http
POST /api/chat/extract-task
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "message": "I need to finish the project proposal by Friday",
  "createTask": true
}
```

Response:

```json
{
  "success": true,
  "data": {
    "extraction": {
      "success": true,
      "task": {
        "title": "Finish project proposal",
        "description": "Complete the project proposal document",
        "dueDate": "2023-09-15T23:59:59.999Z",
        "priority": "high",
        "tags": ["proposal", "project"]
      },
      "confidence": 0.92
    },
    "taskId": "60d21b4667d0d8992e610c86",
    "taskCreated": true
  }
}
```

## Features

### Task Extraction

The task extraction feature uses prompt engineering to extract structured task data from natural language. It can identify:

- Task title and description
- Due dates and times
- Priority levels
- Task tags

Example prompt: "Remind me to call Sarah about the conference next Monday at 10am"

### User Context

The AI assistant can access user data (with proper authorization) to provide contextual responses, including:

- User's tasks and deadlines
- Team information
- Previous conversations

### Conversation Memory

The system maintains conversation history to provide context-aware responses. The conversation window is limited to the most recent 20 messages to maintain performance.

### Streaming Support

For a more responsive experience, the API supports streaming responses with Server-Sent Events (SSE).

## Security and Privacy

The Groq AI integration includes several security features:

1. **Rate limiting**: Prevents abuse of the API
2. **Authentication**: All endpoints require user authentication
3. **Data sanitization**: User data is sanitized before being sent to the AI service
4. **Content filtering**: Responses are filtered for inappropriate content

## Best Practices

1. **Prompt Engineering**: Be specific when asking for task extraction
2. **Conversation Context**: Maintain conversation flow for better results
3. **Feedback**: Use the feedback endpoint to improve AI responses

## Example Prompts

Here are some example prompts for common scenarios:

### Task Creation

- "Create a task to review the marketing materials by next Wednesday"
- "I need to call John about the project tomorrow at 3pm"
- "Remind me to send the quarterly report to finance by Friday"

### Task Queries

- "What tasks are due today?"
- "Show me my high priority tasks"
- "Which team members have overdue tasks?"

### Task Updates

- "Mark the website redesign task as complete"
- "Change the due date of the budget review to next Friday"
- "Assign the documentation task to Sarah"

## Limitations

- The AI may not always correctly interpret ambiguous requests
- Date parsing may be imprecise for complex time expressions
- The system has a context window limitation (most recent 20 messages)
- API rate limits apply to prevent abuse

## Troubleshooting

Common issues and solutions:

1. **Rate limiting errors**: Wait and retry, or adjust the rate limit in configuration
2. **Incorrect task extraction**: Provide more specific information in your prompt
3. **Context limitations**: Break complex conversations into smaller, focused interactions

## Feedback and Improvement

The feedback system is designed to improve AI responses over time. Each response can be rated as:

- Helpful
- Not helpful
- Inaccurate
- Inappropriate

Providing specific comments with feedback helps improve the system. 