import { getDatabase } from '../utils/database';

export interface QualityReport {
  totalAnalyzed: number;
  highQuality: number;
  mediumQuality: number;
  lowQuality: number;
  averageScore: number;
  commonIssues: { issue: string; count: number }[];
  providerPerformance: { provider: string; averageScore: number; count: number }[];
}

export interface BookmarkQualityStats {
  id: string;
  title: string;
  url: string;
  qualityScore: number;
  qualityIssues: string[];
  provider: string;
  createdAt: Date;
}

export class QualityService {
  async getQualityReport(sessionId?: string): Promise<QualityReport> {
    const db = getDatabase();
    
    let whereClause = "WHERE ai_quality_score IS NOT NULL";
    const params: any[] = [];
    
    if (sessionId) {
      whereClause += " AND session_id = $1";
      params.push(sessionId);
    }

    // Get basic statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_analyzed,
        AVG(ai_quality_score) as average_score,
        COUNT(CASE WHEN ai_quality_score >= 0.7 THEN 1 END) as high_quality,
        COUNT(CASE WHEN ai_quality_score >= 0.4 AND ai_quality_score < 0.7 THEN 1 END) as medium_quality,
        COUNT(CASE WHEN ai_quality_score < 0.4 THEN 1 END) as low_quality
      FROM bookmarks 
      ${whereClause}
    `;

    const statsResult = await db.query(statsQuery, params);
    const stats = statsResult.rows[0];

    // Get provider performance
    const providerQuery = `
      SELECT 
        ai_provider as provider,
        AVG(ai_quality_score) as average_score,
        COUNT(*) as count
      FROM bookmarks 
      ${whereClause}
      GROUP BY ai_provider
      ORDER BY average_score DESC
    `;

    const providerResult = await db.query(providerQuery, params);
    const providerPerformance = providerResult.rows.map(row => ({
      provider: row.provider,
      averageScore: parseFloat(row.average_score),
      count: parseInt(row.count)
    }));

    // Get common issues
    const issuesQuery = `
      SELECT 
        jsonb_array_elements_text(ai_quality_issues) as issue,
        COUNT(*) as count
      FROM bookmarks 
      ${whereClause} AND ai_quality_issues IS NOT NULL
      GROUP BY issue
      ORDER BY count DESC
      LIMIT 10
    `;

    const issuesResult = await db.query(issuesQuery, params);
    const commonIssues = issuesResult.rows.map(row => ({
      issue: row.issue,
      count: parseInt(row.count)
    }));

    return {
      totalAnalyzed: parseInt(stats.total_analyzed),
      highQuality: parseInt(stats.high_quality),
      mediumQuality: parseInt(stats.medium_quality),
      lowQuality: parseInt(stats.low_quality),
      averageScore: parseFloat(stats.average_score) || 0,
      commonIssues,
      providerPerformance
    };
  }

  async getLowQualityBookmarks(sessionId?: string, limit: number = 50): Promise<BookmarkQualityStats[]> {
    const db = getDatabase();
    
    let whereClause = "WHERE ai_quality_score IS NOT NULL AND ai_quality_score < 0.7";
    const params: any[] = [];
    
    if (sessionId) {
      whereClause += " AND session_id = $1";
      params.push(sessionId);
    }

    const query = `
      SELECT 
        id,
        title,
        url,
        ai_quality_score as quality_score,
        ai_quality_issues as quality_issues,
        ai_provider as provider,
        created_at
      FROM bookmarks 
      ${whereClause}
      ORDER BY ai_quality_score ASC, created_at DESC
      LIMIT ${limit}
    `;

    const result = await db.query(query, params);
    
    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      url: row.url,
      qualityScore: parseFloat(row.quality_score),
      qualityIssues: JSON.parse(row.quality_issues || '[]'),
      provider: row.provider,
      createdAt: row.created_at
    }));
  }

  async markForReprocessing(bookmarkIds: string[], reason: string = 'Quality improvement retry'): Promise<number> {
    const db = getDatabase();
    
    const query = `
      UPDATE bookmarks 
      SET 
        status = 'pending',
        ai_summary = NULL,
        ai_long_summary = NULL,
        ai_tags = NULL,
        ai_category = NULL,
        ai_provider = NULL,
        ai_quality_score = NULL,
        ai_quality_issues = NULL,
        updated_at = NOW()
      WHERE id = ANY($1)
      RETURNING id
    `;

    const result = await db.query(query, [bookmarkIds]);
    
    // Log the reprocessing action
    console.log(`[Quality Service] Marked ${result.rows.length} bookmarks for reprocessing: ${reason}`);
    
    return result.rows.length;
  }

  async getQualityTrends(sessionId?: string, days: number = 7): Promise<{ date: string; averageScore: number; count: number }[]> {
    const db = getDatabase();
    
    let whereClause = "WHERE ai_quality_score IS NOT NULL AND created_at >= NOW() - INTERVAL '30 days'";
    const params: any[] = [];
    
    if (sessionId) {
      whereClause += " AND session_id = $1";
      params.push(sessionId);
    }

    const query = `
      SELECT 
        DATE(created_at) as date,
        AVG(ai_quality_score) as average_score,
        COUNT(*) as count
      FROM bookmarks 
      ${whereClause}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT ${days}
    `;

    const result = await db.query(query, params);
    
    return result.rows.map(row => ({
      date: row.date,
      averageScore: parseFloat(row.average_score),
      count: parseInt(row.count)
    }));
  }
}

export const qualityService = new QualityService();