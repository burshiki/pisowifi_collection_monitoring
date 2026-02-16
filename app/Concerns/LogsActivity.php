<?php

namespace App\Concerns;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

trait LogsActivity
{
    /**
     * Boot the trait.
     */
    protected static function bootLogsActivity(): void
    {
        static::created(function ($model) {
            $model->logActivity('created', 'Created ' . class_basename($model));
        });

        static::updated(function ($model) {
            $changes = $model->getChanges();
            // Don't log if only timestamps changed
            if (count(array_diff(array_keys($changes), ['updated_at'])) > 0) {
                $model->logActivity('updated', 'Updated ' . class_basename($model), [
                    'old' => $model->getOriginal(),
                    'new' => $model->getAttributes(),
                ]);
            }
        });

        static::deleted(function ($model) {
            $model->logActivity('deleted', 'Deleted ' . class_basename($model));
        });
    }

    /**
     * Log an activity.
     */
    public function logActivity(
        string $event,
        string $description = null,
        array $properties = [],
        string $logName = null
    ): ActivityLog {
        return ActivityLog::create([
            'user_id' => Auth::id(),
            'log_name' => $logName ?? class_basename($this),
            'description' => $description ?? $event,
            'subject_type' => get_class($this),
            'subject_id' => $this->id ?? null,
            'event' => $event,
            'properties' => $properties,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }
}
