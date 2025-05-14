/**
 * Supabase utilities with encryption support
 * 
 * This module provides functions for interacting with Supabase
 * while ensuring data is properly encrypted/decrypted.
 */

import { supabase } from "@/integrations/supabase/client";
import { encryptData, decryptData, isDataFlaggedAsEncrypted } from "./encryption";
import { Task, TasksByDate } from "./types";

/**
 * Fetch tasks from Supabase with decryption support
 * @param userId The user's ID
 * @returns Promise with TasksByDate object
 */
export const fetchTasksFromSupabase = async (userId: string): Promise<TasksByDate> => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId);
      
    if (error) {
      console.error("Error loading tasks from Supabase:", error);
      return {};
    }
    
    if (!data || data.length === 0) {
      return {};
    }
    
    // Convert Supabase tasks to our app format with decryption
    const supabaseTasks: TasksByDate = {};
    
    data.forEach(task => {
      // Decrypt content if it's encrypted
      const decryptedContent = decryptData(task.content, userId);
      
      if (!supabaseTasks[task.date]) {
        supabaseTasks[task.date] = [];
      }
      
      supabaseTasks[task.date].push({
        id: task.id,
        content: decryptedContent,
        isCompleted: task.is_completed,
        createdAt: task.created_at,
        completedAt: task.completed_at,
        priority: task.priority as Task["priority"],
        date: task.date
      });
    });
    
    return supabaseTasks;
  } catch (err) {
    console.error("Error in Supabase task loading:", err);
    return {};
  }
};

/**
 * Save tasks to Supabase with encryption
 * @param tasks The tasks to save
 * @param userId The user's ID
 * @returns Promise indicating success
 */
export const saveTasksToSupabase = async (
  tasks: TasksByDate,
  userId: string
): Promise<boolean> => {
  try {
    // Format tasks for Supabase with encryption
    const supabaseTasks = [];
    
    // Create a set of task IDs to prevent duplicates
    const processedIds = new Set<string>();
    
    for (const date of Object.keys(tasks)) {
      for (const task of tasks[date]) {
        // Skip if we've already processed this task ID
        if (processedIds.has(task.id)) {
          console.warn(`Skipping duplicate task ID: ${task.id}`);
          continue;
        }
        
        // Add to processed set
        processedIds.add(task.id);
        
        // Encrypt the task content (our encryptData function handles already-encrypted content)
        const encryptedContent = encryptData(task.content, userId);
        
        // Prepare the task for Supabase
        supabaseTasks.push({
          id: task.id,
          user_id: userId,
          content: encryptedContent,
          is_completed: !!task.isCompleted,
          created_at: task.createdAt,
          completed_at: task.completedAt,
          priority: task.priority,
          date: task.date,
          is_encrypted: true
        });
      }
    }
    
    if (supabaseTasks.length === 0) {
      return true; // Nothing to save
    }
    
    // First, clear old tasks for this user
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('user_id', userId);
      
    if (deleteError) {
      console.error("Error deleting old tasks:", deleteError);
      return false;
    }
    
    // Then insert all current tasks in batches
    const BATCH_SIZE = 50;
    
    for (let i = 0; i < supabaseTasks.length; i += BATCH_SIZE) {
      const batch = supabaseTasks.slice(i, i + BATCH_SIZE);
      
      const { error: insertError } = await supabase
        .from('tasks')
        .upsert(batch, { 
          onConflict: 'id',
          ignoreDuplicates: false
        });
        
      if (insertError) {
        console.error("Error syncing tasks to Supabase:", insertError);
        return false;
      }
    }
    
    return true;
  } catch (err) {
    console.error("Error in Supabase task saving:", err);
    return false;
  }
};
