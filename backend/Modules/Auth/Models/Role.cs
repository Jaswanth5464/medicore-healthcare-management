namespace MediCore.API.Modules.Auth.Models
{
// This model represents a Job Role (like 'Doctor' or 'SuperAdmin').
// It defines what a user is allowed to see or do in the system.
    public class Role
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    }
}