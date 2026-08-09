const API_BASE_URL = "http://localhost:8080";

const readResponse = async (response, operation) => {
  const text = await response.text();
  let result = {};

  if (text) {
    try {
      result = JSON.parse(text);
    } catch {
      if (response.ok) return { raw_response: text };
      throw new Error(`${operation} returned invalid JSON (${response.status}): ${text}`);
    }
  }

  if (!response.ok) {
    throw new Error(
      result.detail || result.message || result.raw_response ||
      `${operation} failed with status ${response.status}.`
    );
  }

  return result;
};

export const createWorkflow = async (workflowName, graphJson) => {
  const response = await fetch(`${API_BASE_URL}/workflows`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workflow_name: workflowName, graph_json: graphJson }),
  });
  return readResponse(response, "Workflow creation");
};

export const requestWorkflowExecution = async (workflowId) => {
  const response = await fetch(`${API_BASE_URL}/execution/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workflow_id: workflowId }),
  });
  return readResponse(response, "Execution request");
};

export const getAllWorkflows = async () => {
  const response = await fetch(`${API_BASE_URL}/workflows/all`);
  return readResponse(response, "Loading workflows");
};

export const deleteWorkflow = async (workflowId) => {
  const response = await fetch(
    `${API_BASE_URL}/workflows/${encodeURIComponent(workflowId)}`,
    { method: "DELETE" }
  );
  return readResponse(response, "Workflow deletion");
};


export const getExecutions = async () => {
  const response = await fetch(
    `${API_BASE_URL}/execution`
  );

  return readResponse(
    response,
    "Loading executions"
  );
};
