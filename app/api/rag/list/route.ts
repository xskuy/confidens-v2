import { auth } from '@/app/(auth)/auth';
import { spawn } from 'node:child_process';
import path from 'node:path';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const result = await runPythonListDocuments();

    if (result.success) {
      return Response.json(
        {
          success: true,
          documents: result.documents,
          totalResources: result.totalResources,
          totalChunks: result.totalChunks,
        },
        { status: 200 },
      );
    } else {
      console.error('Python list error:', result.error);
      return new Response('Failed to list documents', { status: 500 });
    }
  } catch (error) {
    console.error('Error listing documents:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

async function runPythonListDocuments(): Promise<{
  success: boolean;
  documents?: any[];
  totalResources?: number;
  totalChunks?: number;
  error?: string;
}> {
  return new Promise((resolve) => {
    const pythonScriptPath = path.join(
      process.cwd(),
      'rag-python',
      'api_list.py',
    );
    const python = spawn('uv', ['run', 'python', pythonScriptPath], {
      cwd: path.join(process.cwd(), 'rag-python'),
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout.trim());
          resolve({
            success: true,
            documents: result.documents,
            totalResources: result.total_resources,
            totalChunks: result.total_chunks,
          });
        } catch (parseError) {
          resolve({
            success: false,
            error: `Failed to parse Python output: ${stdout}`,
          });
        }
      } else {
        resolve({
          success: false,
          error: `Python script failed with code ${code}: ${stderr}`,
        });
      }
    });

    python.on('error', (error) => {
      resolve({
        success: false,
        error: `Failed to spawn Python process: ${error.message}`,
      });
    });
  });
}
