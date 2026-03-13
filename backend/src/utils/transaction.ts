import mongoose from 'mongoose';

/**
 * Execute operations within a MongoDB transaction
 * Ensures atomicity - all operations succeed or all fail
 */
export async function withTransaction<T>(
  operation: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const result = await operation(session);
    
    await session.commitTransaction();
    console.log('[TRANSACTION] Transaction committed successfully');
    
    return result;
  } catch (error) {
    await session.abortTransaction();
    console.error('[TRANSACTION] Transaction aborted:', error);
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Execute operations within a transaction with retry logic
 * Retries up to maxRetries times on transient errors
 */
export async function withTransactionRetry<T>(
  operation: (session: mongoose.ClientSession) => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await withTransaction(operation);
    } catch (error: any) {
      lastError = error;
      
      // Check if error is transient and should be retried
      const isTransient = 
        error.hasErrorLabel?.('TransientTransactionError') ||
        error.code === 112 || // WriteConflict
        error.code === 251;  // NoSuchTransaction
      
      if (!isTransient || attempt === maxRetries) {
        throw error;
      }
      
      console.log(`[TRANSACTION] Attempt ${attempt} failed, retrying... (${error.message})`);
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
    }
  }
  
  throw lastError!;
}
