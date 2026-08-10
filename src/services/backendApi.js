const WORKFLOW_API_BASE_URL = "http://localhost:8080";
const DATASPACE_API_BASE_URL = "http://localhost:8000";

async function readResponse(response, operation) {
  const text = await response.text();
  let result = {};

  if (text) {
    try {
      result = JSON.parse(text);
    } catch {
      if (response.ok) {
        return { raw_response: text };
      }

      throw new Error(
        `${operation} returned invalid JSON (${response.status}): ${text}`
      );
    }
  }

  if (!response.ok) {
    throw new Error(
      result?.detail ||
        result?.message ||
        result?.raw_response ||
        `${operation} failed with status ${response.status}.`
    );
  }

  return result;
}


// -----------------------------------------------------------------------------
// Workflow / execution API — localhost:8080
// -----------------------------------------------------------------------------

export async function createWorkflow(workflowName, graphJson) {
  const response = await fetch(
    `${WORKFLOW_API_BASE_URL}/workflows`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workflow_name: workflowName,
        graph_json: graphJson,
      }),
    }
  );

  return readResponse(response, "Workflow creation");
}

export async function requestWorkflowExecution(workflowId) {
  const response = await fetch(
    `${WORKFLOW_API_BASE_URL}/execution/request`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workflow_id: workflowId,
      }),
    }
  );

  return readResponse(response, "Execution request");
}

export async function getAllWorkflows() {
  const response = await fetch(
    `${WORKFLOW_API_BASE_URL}/workflows/all`
  );

  return readResponse(response, "Loading workflows");
}

export async function deleteWorkflow(workflowId) {
  const response = await fetch(
    `${WORKFLOW_API_BASE_URL}/workflows/${encodeURIComponent(
      workflowId
    )}`,
    {
      method: "DELETE",
    }
  );

  return readResponse(response, "Workflow deletion");
}

export async function getExecutions() {
  const response = await fetch(
    `${WORKFLOW_API_BASE_URL}/execution`
  );

  return readResponse(response, "Loading executions");
}


// -----------------------------------------------------------------------------
// Dataspace API — localhost:8000
// -----------------------------------------------------------------------------

export async function getCatalogs(signal) {
  const response = await fetch(
    `${DATASPACE_API_BASE_URL}/catalogs`,
    {
      headers: {
        Accept: "application/json",
      },
      signal,
    }
  );

  const data = await readResponse(
    response,
    "Catalog request"
  );

  if (!Array.isArray(data)) {
    throw new Error(
      "The catalog response must be a JSON array."
    );
  }

  return data;
}

export async function getAgreements(signal) {
  const response = await fetch(
    `${DATASPACE_API_BASE_URL}/agreements`,
    {
      headers: {
        Accept: "application/json",
      },
      signal,
    }
  );

  const data = await readResponse(
    response,
    "Agreement request"
  );

  if (!Array.isArray(data)) {
    throw new Error(
      "The agreement response must be a JSON array."
    );
  }

  return data;
}

export async function negotiateAsset(bpn, assetId) {
  const response = await fetch(
    `${DATASPACE_API_BASE_URL}/negotiations`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        bpn,
        assetId,
      }),
    }
  );

  return readResponse(
    response,
    "Negotiation request"
  );
}
