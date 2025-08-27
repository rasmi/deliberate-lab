import {Timestamp} from 'firebase-admin/firestore';
import {
  AgentModelSettings,
  APIKeyConfig,
  ApiKeyType,
  ModelGenerationConfig,
  ModelResponse,
  ModelResponseStatus,
  StructuredOutputConfig,
  UserProfile,
  createModelLogEntry,
} from '@deliberation-lab/utils';

import {getGeminiAPIResponse} from './api/gemini.api';
import {getOpenAIAPIChatCompletionResponse} from './api/openai.api';
import {ollamaChat} from './api/ollama.api';

import {app} from './app';
import {writeModelLogEntry} from './log.utils';

/** Calls API and writes ModelLogEntry to experiment. */
export async function processModelResponse(
  experimentId: string,
  cohortId: string,
  participantId: string,
  stageId: string,
  userProfile: UserProfile,
  publicId: string,
  privateId: string,
  description: string,
  apiKeyConfig: APIKeyConfig,
  prompt: string | Array<{role: string; content: string; name?: string}>,
  modelSettings: AgentModelSettings,
  generationConfig: ModelGenerationConfig,
  structuredOutputConfig?: StructuredOutputConfig,
  numRetries: number = 0,
): Promise<ModelResponse> {
  const startTime = Date.now();
  console.log(
    `[PERF] processModelResponse START - Model: ${modelSettings.modelName}, API: ${modelSettings.apiType}`,
  );
  // Convert prompt to string for logging
  const promptText =
    typeof prompt === 'string'
      ? prompt
      : prompt
          .map(
            (m) =>
              `${m.role.toUpperCase()}${m.name ? `(${m.name})` : ''}: ${m.content}`,
          )
          .join('\n');

  let response = {status: ModelResponseStatus.NONE};
  let lastError: Error | undefined;
  const maxRetries = numRetries;
  const initialDelay = 1000; // 1 second initial delay

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Create a new log entry for each attempt
    const log = createModelLogEntry({
      experimentId,
      cohortId,
      participantId,
      stageId,
      userProfile,
      publicId,
      privateId,
      description:
        attempt > 0 ? `${description} (retry ${attempt})` : description,
      prompt: promptText,
      createdTimestamp: Timestamp.now(),
    });
    try {
      const queryTimestamp = Timestamp.now();
      const apiCallStart = Date.now();
      console.log(
        `[PERF] Calling getAgentResponse (attempt ${attempt + 1}/${maxRetries + 1})...`,
      );
      response = (await getAgentResponse(
        apiKeyConfig,
        prompt,
        modelSettings,
        generationConfig,
        structuredOutputConfig,
      )) as ModelResponse;
      const responseTimestamp = Timestamp.now();
      console.log(
        `[PERF] getAgentResponse completed - Elapsed: ${Date.now() - apiCallStart}ms`,
      );

      log.response = response;
      log.queryTimestamp = queryTimestamp;
      log.responseTimestamp = responseTimestamp;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(error);

      // Log the error response
      log.response = {
        status: ModelResponseStatus.UNKNOWN_ERROR,
        errorMessage: lastError.message,
      };
      log.queryTimestamp = Timestamp.now();
      log.responseTimestamp = Timestamp.now();
    }

    // Write log entry for every attempt
    writeModelLogEntry(experimentId, log);

    // Check if we should retry
    const shouldRetry =
      attempt < maxRetries &&
      (response.status === ModelResponseStatus.PROVIDER_UNAVAILABLE_ERROR ||
        response.status === ModelResponseStatus.INTERNAL_ERROR ||
        response.status === ModelResponseStatus.UNKNOWN_ERROR);

    if (shouldRetry) {
      const delay = initialDelay * Math.pow(2, attempt);
      console.log(
        `API error (${response.status}), retrying after ${delay}ms (attempt ${attempt + 1}/${maxRetries})`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    } else {
      // Success or non-retryable error, exit loop
      break;
    }
  }

  // If we exhausted all retries with an error, log it
  if (lastError && response.status === ModelResponseStatus.NONE) {
    console.error(`Failed after ${numRetries} retries:`, lastError);
  }

  console.log(
    `[PERF] processModelResponse END - Status: ${response.status}, Total elapsed: ${Date.now() - startTime}ms`,
  );
  return response;
}

// TODO: Rename to getAPIResponse?
export async function getAgentResponse(
  apiKeyConfig: APIKeyConfig,
  prompt: string | Array<{role: string; content: string; name?: string}>,
  modelSettings: AgentModelSettings,
  generationConfig: ModelGenerationConfig,
  structuredOutputConfig?: StructuredOutputConfig,
): Promise<ModelResponse> {
  const startTime = Date.now();
  console.log(
    `[PERF] getAgentResponse START - API Type: ${modelSettings.apiType}`,
  );
  let response;

  if (modelSettings.apiType === ApiKeyType.GEMINI_API_KEY) {
    const geminiStart = Date.now();
    console.log(`[PERF] Calling Gemini API...`);
    response = await getGeminiResponse(
      apiKeyConfig,
      modelSettings.modelName,
      prompt,
      generationConfig,
      structuredOutputConfig,
    );
    console.log(
      `[PERF] Gemini API response - Elapsed: ${Date.now() - geminiStart}ms`,
    );
  } else if (modelSettings.apiType === ApiKeyType.OPENAI_API_KEY) {
    const openaiStart = Date.now();
    console.log(`[PERF] Calling OpenAI API...`);
    response = await getOpenAIAPIResponse(
      apiKeyConfig,
      modelSettings.modelName,
      prompt,
      generationConfig,
      structuredOutputConfig,
    );
    console.log(
      `[PERF] OpenAI API response - Elapsed: ${Date.now() - openaiStart}ms`,
    );
  } else if (modelSettings.apiType === ApiKeyType.OLLAMA_CUSTOM_URL) {
    const ollamaStart = Date.now();
    console.log(`[PERF] Calling Ollama API...`);
    response = await getOllamaResponse(
      apiKeyConfig,
      modelSettings.modelName,
      prompt,
      generationConfig,
    );
    console.log(
      `[PERF] Ollama API response - Elapsed: ${Date.now() - ollamaStart}ms`,
    );
  } else {
    response = {
      status: ModelResponseStatus.CONFIG_ERROR,
      generationConfig,
      errorMessage: `Error: invalid apiKey type`,
    };
  }

  if (response.status !== ModelResponseStatus.OK) {
    console.error(
      `GetAgentResponse: response error status: ${response.status}; message: ${response.errorMessage}`,
    );
  }

  console.log(
    `[PERF] getAgentResponse END - Status: ${response.status}, Total elapsed: ${Date.now() - startTime}ms`,
  );
  return response;
}

export async function getGeminiResponse(
  apiKeyConfig: APIKeyConfig,
  modelName: string,
  prompt: string | Array<{role: string; content: string; name?: string}>,
  generationConfig: ModelGenerationConfig,
  structuredOutputConfig?: StructuredOutputConfig,
): Promise<ModelResponse> {
  return await getGeminiAPIResponse(
    apiKeyConfig.geminiApiKey,
    modelName,
    prompt,
    generationConfig,
    structuredOutputConfig,
  );
}

export async function getOpenAIAPIResponse(
  apiKeyConfig: APIKeyConfig,
  model: string,
  prompt: string | Array<{role: string; content: string; name?: string}>,
  generationConfig: ModelGenerationConfig,
  structuredOutputConfig?: StructuredOutputConfig,
): Promise<ModelResponse> {
  return await getOpenAIAPIChatCompletionResponse(
    apiKeyConfig.openAIApiKey?.apiKey || '',
    apiKeyConfig.openAIApiKey?.baseUrl || null,
    model,
    prompt,
    generationConfig,
    structuredOutputConfig,
  );
}

export async function getOllamaResponse(
  apiKeyConfig: APIKeyConfig,
  modelName: string,
  prompt: string | Array<{role: string; content: string; name?: string}>,
  generationConfig: ModelGenerationConfig,
): Promise<ModelResponse> {
  // Convert string to array format for ollamaChat
  const messages = typeof prompt === 'string' ? [prompt] : prompt;
  return await ollamaChat(
    messages,
    modelName,
    apiKeyConfig.ollamaApiKey,
    generationConfig,
  );
}
