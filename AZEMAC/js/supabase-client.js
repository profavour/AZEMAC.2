// ==========================================
// AZEMAC PROPERTIES - SUPABASE CLIENT
// ==========================================

const SUPABASE_URL = "https://tahsugiiyheozgxxhtty.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhaHN1Z2lpeWhlb3pneHhodHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMzE5OTgsImV4cCI6MjEwMjgwNzk5OH0.N8WZSEXgX9j7KWvNnEeaF4twRCXVyE2lS8GKDkGLH2o";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


// Fetch every property from the database, newest first.
async function fetchAllProperties() {

    const { data, error } = await supabaseClient
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error loading properties:", error);
        return [];
    }

    return data || [];

}


// Fetch a single property by its numeric id.
async function fetchPropertyById(id) {

    const { data, error } = await supabaseClient
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        console.error("Error loading property:", error);
        return null;
    }

    return data;

}
