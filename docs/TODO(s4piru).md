# UI
 - Google Docs-style editor (No max height, scrollable vertically; the document's max width is 80% of the window size).
 - First, users write the core idea and requirements for the document, then click the "Start Discussion" button.
 - When users click the "Start Discussion" button, the base AI immediately creates a draft.
 - Users and AI participants can select words or sentences, and the background color changes according to the selection.
 - A comment window appears on the left side of the screen when words or sentences are selected. Each comment window corresponds to the selection and serves as a chat thread.
 - After the base AI creates a draft, other AI participants review it. They select words or sentences and add comments in the corresponding comment window.
 - Users and AI can discuss within each comment window, and AI provides replacement suggestions.
 - Users can accept, modify, or decline AI's replacement suggestions in the comment window and replace the related selection with the suggestion by clicking a button.
# AI Assistant
 ## Features
  - The base AI creates a draft based on user input.
  - AI participants review the draft, select words or sentences, and provide replacement suggestions in comment windows.
  - AI participants can chat with the user in each comment window and create replacement suggestions.
 ## AI participants
  ### Base AI
   - Creates a draft based on user input (core idea, requirements).
  ### Hourei AI
   - Extracts legal terms from draft sentences using the OpenAI API.
   - Calls the Hourei API with the extracted terms.
   - Generates a response using the OpenAI API with data from the Hourei API and draft sentences.
  ### Other AI
# Other
 - Upload to EC2 and make it publicly accessible on the internet.