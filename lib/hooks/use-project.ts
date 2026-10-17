"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";

export type ProjectContext = {
  id: string;
  name: string;
  slug: string;
  region: string;
  status: string;
  supabase_ref: string | null;
  org_id: string;
  created_at: string;
  org_name: string;
  org_plan: string;
};

let cachedProjects: ProjectContext[] = [];
let cachedOrgId: string | null = null;
let cachedUserId: string | null = null;

export function useProject() {
  const [projects, setProjects] = useState<ProjectContext[]>([]);
  const [project, setProject] = useState<ProjectContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
    );
    let active = true;
    async function loadProjects(force = false, targetId?: string) {
      const { data: { user }, error: userError } = await sb.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Not authenticated");
      if (!force && cachedProjects.length && cachedOrgId && cachedUserId === user.id) {
        if (active) {
          setProjects(cachedProjects);
          const selected = localStorage.getItem(`masidy_project_${cachedOrgId}`);
          setProject(cachedProjects.find(item => item.id === selected) ?? cachedProjects[0]);
          setLoading(false);
        }
        return;
      }
      const { data: membership, error: membershipError } = await sb.from("org_members")
        .select("org_id, orgs(id, name, plan)").eq("user_id", user.id).limit(1).single();
      if (membershipError) throw membershipError;
      if (!membership) throw new Error("No organization");
      const org = membership.orgs as unknown as { id: string; name: string; plan: string };
      const { data, error: projectsError } = await sb.from("projects").select("*")
        .eq("org_id", org.id).order("created_at", { ascending: true });
      if (projectsError) throw projectsError;
      cachedProjects = (data ?? []).map(item => ({ ...(item as ProjectContext), org_name: org.name, org_plan: org.plan }));
      cachedOrgId = org.id;
      cachedUserId = user.id;
      if (active) {
        setProjects(cachedProjects);
        const selected = targetId ?? localStorage.getItem(`masidy_project_${org.id}`);
        if (targetId) localStorage.setItem(`masidy_project_${org.id}`, targetId);
        setProject(cachedProjects.find(item => item.id === selected) ?? cachedProjects[0] ?? null);
        setLoading(false);
        if (!cachedProjects.length) setError("No project");
        else setError(null);
      }
    }

    function onProjectChange(event: Event) {
      const id = (event as CustomEvent<{ id: string }>).detail?.id;
      const next = cachedProjects.find(item => item.id === id);
      setProject(next ?? null);
      setError(next ? null : "No project");
    }
    function onProjectUpdated(event: Event) {
      const update = (event as CustomEvent<{ id: string; name: string }>).detail;
      if (!update) return;
      cachedProjects = cachedProjects.map(item => item.id === update.id ? { ...item, name: update.name } : item);
      setProjects(cachedProjects);
      setProject(current => current?.id === update.id ? { ...current, name: update.name } : current);
    }
    function onProjectsRefresh(event: Event) {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id;
      loadProjects(true, id).catch(e => {
        if (active) setError(e instanceof Error ? e.message : String(e));
      });
    }
    window.addEventListener("masidy:project-change", onProjectChange);
    window.addEventListener("masidy:project-updated", onProjectUpdated);
    window.addEventListener("masidy:projects-refresh", onProjectsRefresh);
    loadProjects().catch(e => {
      if (active) {
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      }
    });
    return () => {
      active = false;
      window.removeEventListener("masidy:project-change", onProjectChange);
      window.removeEventListener("masidy:project-updated", onProjectUpdated);
      window.removeEventListener("masidy:projects-refresh", onProjectsRefresh);
    };
  }, []);

  const selectProject = useCallback((id: string) => {
    const next = projects.find(item => item.id === id);
    if (!next || !cachedOrgId) return;
    localStorage.setItem(`masidy_project_${cachedOrgId}`, id);
    window.dispatchEvent(new CustomEvent("masidy:project-change", { detail: { id } }));
    setProject(next);
  }, [projects]);

  const updateProjectName = useCallback((id: string, name: string) => {
    cachedProjects = cachedProjects.map(item => item.id === id ? { ...item, name } : item);
    window.dispatchEvent(new CustomEvent("masidy:project-updated", { detail: { id, name } }));
  }, []);

  const removeProject = useCallback((id: string) => {
    cachedProjects = cachedProjects.filter(item => item.id !== id);
    setProjects(cachedProjects);
    const next = cachedProjects[0];
    if (next && cachedOrgId) localStorage.setItem(`masidy_project_${cachedOrgId}`, next.id);
    else if (cachedOrgId) localStorage.removeItem(`masidy_project_${cachedOrgId}`);
    window.dispatchEvent(new CustomEvent("masidy:project-change", { detail: { id: next?.id ?? "" } }));
  }, []);

  return { project, projects, selectProject, updateProjectName, removeProject, loading, error };
}
