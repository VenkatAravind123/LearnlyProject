# Personalized Learning Application (GenAI & Agentic AI)
Description:
Design and develop an AI-powered personalized learning assistant that combines Generative AI and Agentic AI to enhance the educational experience for individual students. The assistant will generate custom study materials, summaries, and quizzes based on each student's unique curriculum and learning style, and will proactively guide and support learning through advanced planning and feedback mechanisms.
Key Features:
Personalized Content Generation:
Use cutting-edge Generative AI models (e.g., GPT, Llama) to create summaries, flashcards, quizzes, and study guides tailored to each student's syllabus, proficiency level, and preferred learning format. 
User Interaction:
Provide an intuitive web or mobile interface for students to upload materials, interact with the assistant, access personalized recommendations, and track their learning journey.

**To run the project in your local system follow these steps:
There are two parts for the project backend and frontend  **
## Backend (backend folder):
**To run the backend first change the directory to backend by-**
```
cd backend  
npm install
```
Start the server using the command-  
```
nodemon src/app.js
```

## Frontend (hclproject folder):  
**To run the frontend first change the directory to react app-**  
```
cd hclproject  
npm install
```
Start the react app using-  
```
npm run dev
```

## AI (Ollama) Setup (Required)
This project uses Ollama for AI features (assistant, summaries, quizzes, study plan generation).

1) Install Ollama: https://ollama.com  
2) Make sure Ollama is running (Windows/Mac usually runs as a service)
3) Pull the model configured in backend env:

- Check backend/.env:
  - OLLAMA_BASE_URL=http://127.0.0.1:11434
  - OLLAMA_MODEL=...

Then run:
ollama pull <YOUR_MODEL_NAME>

Example (lighter model recommended):
ollama pull llama3.2:3b

Verify:
ollama list
curl http://127.0.0.1:11434/api/tags
