// Test script to verify project visibility fix
import { apiFetchProjects, apiAddProject } from './services/api.ts';

async function testProjectVisibility() {
  console.log('Testing project visibility fix...');

  try {
    // Test fetching projects
    console.log('Fetching projects from API...');
    const projects = await apiFetchProjects();
    console.log(`Found ${projects.length} projects:`, projects.map(p => ({ id: p.id, name: p.name })));

    // Test adding a new project
    console.log('Adding a test project...');
    const newProject = await apiAddProject({
      name: 'Test Project - API Integration',
      billingType: 'hourly',
      ratePerHour: 50,
      description: 'Test project to verify API integration is working'
    });
    console.log('Added project:', newProject);

    // Fetch projects again to verify the new project appears
    console.log('Fetching projects again to verify new project is visible...');
    const updatedProjects = await apiFetchProjects();
    console.log(`Found ${updatedProjects.length} projects after adding new one`);

    const testProject = updatedProjects.find(p => p.name === 'Test Project - API Integration');
    if (testProject) {
      console.log('✅ SUCCESS: New project is visible in the list!');
      console.log('Project details:', testProject);
    } else {
      console.log('❌ FAILED: New project is not visible in the list');
    }

  } catch (error) {
    console.error('❌ ERROR: Project visibility test failed:', error.message);
  }
}

// Run the test
testProjectVisibility();