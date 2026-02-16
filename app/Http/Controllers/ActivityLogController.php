<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityLogController extends Controller
{
    /**
     * Display a listing of the activity logs.
     */
    public function index(Request $request)
    {
        $query = ActivityLog::with('user')
            ->orderBy('created_at', 'desc');

        // Filter by user if provided
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by log name if provided
        if ($request->filled('log_name')) {
            $query->where('log_name', $request->log_name);
        }

        // Filter by event if provided
        if ($request->filled('event')) {
            $query->where('event', $request->event);
        }

        // Search by description
        if ($request->filled('search')) {
            $query->where('description', 'like', '%' . $request->search . '%');
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $logs = $query->paginate(50)->withQueryString();

        // Get unique log names and events for filters
        $logNames = ActivityLog::select('log_name')
            ->distinct()
            ->whereNotNull('log_name')
            ->pluck('log_name');

        $events = ActivityLog::select('event')
            ->distinct()
            ->whereNotNull('event')
            ->pluck('event');

        return Inertia::render('activity-logs/index', [
            'logs' => $logs,
            'filters' => $request->only(['user_id', 'log_name', 'event', 'search', 'date_from', 'date_to']),
            'logNames' => $logNames,
            'events' => $events,
        ]);
    }

    /**
     * Display the specified activity log.
     */
    public function show(ActivityLog $activityLog)
    {
        $activityLog->load('user');

        return Inertia::render('activity-logs/show', [
            'log' => $activityLog,
        ]);
    }
}
