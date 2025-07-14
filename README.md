# Portfolio CMS Backend

A complete Express.js + TypeScript CMS boilerplate for portfolio websites with MongoDB, Cloudinary integration, role-based authentication, and SEO support.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control (admin/editor)
- **Content Management**: Dynamic page content management with SEO metadata
- **Blog System**: Full-featured blog with categories, tags, and publishing workflow
- **Project Portfolio**: Showcase projects with tech stack, images, and live demos
- **File Upload**: Cloudinary integration for image uploads with automatic optimization
- **SEO Optimization**: Built-in SEO fields for all content types
- **User Management**: Admin panel for user management
- **TypeScript**: Full TypeScript support with proper type definitions
- **Validation**: Input validation and error handling
- **Pagination**: Built-in pagination for all list endpoints

## Tech Stack

- **Backend**: Express.js + TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcryptjs
- **File Storage**: Cloudinary
- **Validation**: Mongoose schema validation
- **Image Processing**: Automatic image optimization via Cloudinary

## Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env`:

   - MongoDB connection string
   - JWT secret key
   - Cloudinary credentials

5. Start development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Content Management

- `GET /api/content/:page` - Get page content (public)
- `GET /api/content` - Get all pages (admin/editor)
- `PUT /api/content/:page` - Update page content (admin/editor)

### Blog

- `GET /api/blog` - Get published blog posts (public)
- `GET /api/blog/post/:slug` - Get single blog post (public)
- `GET /api/blog/admin/all` - Get all blog posts (admin/editor)
- `POST /api/blog` - Create blog post (admin/editor)
- `PUT /api/blog/:id` - Update blog post (admin/editor)
- `DELETE /api/blog/:id` - Delete blog post (admin/editor)

### Projects

- `GET /api/projects` - Get published projects (public)
- `GET /api/projects/:id` - Get single project (public)
- `GET /api/projects/admin/all` - Get all projects (admin/editor)
- `POST /api/projects` - Create project (admin/editor)
- `PUT /api/projects/:id` - Update project (admin/editor)
- `DELETE /api/projects/:id` - Delete project (admin/editor)

### File Upload

- `POST /api/upload/image` - Upload single image
- `POST /api/upload/images` - Upload multiple images
- `DELETE /api/upload/image/:public_id` - Delete image

### User Management

- `GET /api/users` - Get all users (admin only)
- `POST /api/users` - Create new user (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

## Data Models

### User

- username, email, password
- role (admin/editor)
- profile information
- account status

### Content (Pages)

- page type (home/about/contact/services)
- dynamic content data
- SEO metadata
- publication status

### Blog Post

- title, slug, content, excerpt
- category, tags
- featured image
- SEO metadata
- publication workflow

### Project

- title, description, content
- tech stack, images
- GitHub/demo links
- category, featured status
- SEO metadata

## Development

Build for production:

```bash
npm run build
```

Start production server:

```bash
npm start
```

```bash
docker run --name mongodb -d -p 27017:27017 mongodb/mongodb-community-server:$MONGODB_VERSION
```

```bash
docker run --name mongodb -d -p 27017:27017 -v $(pwd)/data:/data/db mongodb/mongodb-community-server:$MONGODB_VERSION
```

## Environment Variables

Required environment variables:

- `PORT` - Server port (default: 5000)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Role-based access control
- Input validation and sanitization
- File upload restrictions
- Error handling without information leakage

## License

MIT License
