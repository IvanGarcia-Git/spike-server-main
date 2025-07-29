# Spikes Server - Developer Manual

## 1. PROJECT INFORMATION

### Purpose and Project Objectives
Spikes Server is a B2C energy saving company CRM (Customer Relationship Management) system. The platform manages the complete sales cycle from lead generation to contract management, including user management, task tracking, commissions, and document handling for energy service contracts (electricity, gas, and telephony).

### Business Use Cases / Business Logic
The main business flows include:
- **Lead Management Flow**: Creation, assignment, tracking, and conversion of potential customers
- **Contract Management Flow**: Creating, validating, and managing energy service contracts (LUZ, GAS, TELEFONIA)
- **User Hierarchy Management**: Managing sales teams with managers and agents in hierarchical groups
- **Commission and Liquidation Flow**: Tracking sales performance and calculating agent commissions
- **Document Management**: Handling contract documents and customer documentation
- **Task and Reminder System**: Managing follow-ups and scheduled activities
- **Absence Management**: Tracking employee holidays and absences

## 2. ENVIRONMENT CONFIGURATION

### Environment Variables and Configuration
The following environment variables are required in the `.env` file:

```bash
# Database Configuration
HOST=localhost                    # MySQL database host
MYSQL_USER=root                   # MySQL username
MYSQL_USER_PASSWORD=password      # MySQL password
MYSQL_DB=spikes_db               # Database name

# Application Configuration
NODE_ENV=development             # Environment: development or production
PORT=3000                        # Server port (defaults to 3000)
JWT_SECRET=your_jwt_secret_here  # Secret key for JWT token signing

# AWS Configuration (if using S3 for file storage)
AWS_ACCESS_KEY_ID=your_key       # AWS access key
AWS_SECRET_ACCESS_KEY=your_secret # AWS secret key
AWS_REGION=eu-west-1             # AWS region
AWS_S3_BUCKET=your_bucket        # S3 bucket name
```

### Installation and Setup Instructions

1. **Prerequisites**:
   - Node.js v16+ and npm
   - MySQL 5.7+ or MariaDB
   - Git

2. **Clone the repository**:
   ```bash
   git clone [repository-url]
   cd spikes-server
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Configure environment**:
   ```bash
   cp .env.example .env  # If example exists, otherwise create .env
   # Edit .env with your configuration
   ```

5. **Setup database**:
   ```bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE spikes_db;
   exit;
   ```

6. **Run migrations**:
   ```bash
   npm run migration:run
   ```

7. **Start development server**:
   ```bash
   npm run dev
   ```

### Relevant Commands

```bash
# Development
npm run dev                      # Start development server with hot reload
npm run build                    # Compile TypeScript to JavaScript
npm start                        # Start production server

# Database Migrations
npm run migration:generate       # Generate new migration from entity changes
npm run migration:run           # Run pending migrations
npm run migration:revert        # Revert last migration

# TypeORM CLI
npm run typeorm                 # Access TypeORM CLI

# Testing
# No test commands configured - testing infrastructure not implemented
```

## 3. PROJECT STRUCTURE

### General Architecture and Design Patterns
The project implements a **Layered Architecture** (similar to MVC) with clear separation of concerns:
- **Presentation Layer**: Routes and Controllers
- **Business Logic Layer**: Services
- **Data Access Layer**: TypeORM Entities and Repositories
- **Cross-cutting Concerns**: Middlewares, Helpers, DTOs

Design patterns implemented:
- **Repository Pattern**: Through TypeORM repositories
- **DTO Pattern**: Data Transfer Objects for request/response validation
- **Middleware Pattern**: For authentication and error handling
- **Module Pattern**: Controllers organized as modules

### Technology Stack
- **Language**: TypeScript 5.3.3
- **Runtime**: Node.js
- **Framework**: Express.js 4.18.2
- **Database**: MySQL
- **ORM**: TypeORM 0.3.20
- **Authentication**: jsonwebtoken 9.0.2
- **Password Hashing**: bcryptjs 2.4.3
- **File Upload**: multer 1.4.5-lts.1
- **Cloud Storage**: aws-sdk 2.1563.0
- **HTTP Client**: axios 1.6.7
- **Email Service**: resend 3.2.0
- **Environment Management**: dotenv 16.4.5

### Version and Main Dependencies
- **Project Version**: 1.0.0
- **Node Engine**: Not specified (recommend v16+)
- **Package Manager**: npm

Critical dependencies:
- `typeorm`: Database ORM and migrations
- `express`: Web framework
- `jsonwebtoken`: Authentication system
- `mysql2`: MySQL database driver

### Directory and File Organization
```
spikes-server/
├── src/                        # Source code directory
│   ├── controllers/           # HTTP request handlers (33 controllers)
│   ├── services/             # Business logic layer (36 services)
│   ├── models/               # TypeORM entity definitions (44 entities)
│   ├── routes/               # Express route definitions (33 routers)
│   ├── dto/                  # Data Transfer Objects (8 DTOs)
│   ├── enums/                # Enumeration definitions (8 enums)
│   ├── helpers/              # Utility functions and integrations
│   │   ├── aws.helper.ts     # AWS S3 file upload
│   │   ├── emails.helper.ts  # Email sending utilities
│   │   └── callbell.helper.ts # Callbell integration
│   ├── middlewares/          # Express middleware
│   │   ├── auth.ts          # JWT authentication
│   │   ├── multer.ts        # File upload configuration
│   │   └── error.ts         # Error handling
│   ├── migrations/           # Database migrations (83 files)
│   ├── webhooks/            # Webhook handlers
│   └── app.ts               # Application entry point
├── dist/                     # Compiled JavaScript output
├── app-data-source.ts       # TypeORM configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Project configuration
└── nodemon.json            # Development server config
```

### Naming Conventions
- **Files**: kebab-case (e.g., `user-status.enum.ts`)
- **Classes/Interfaces**: PascalCase (e.g., `UserEntity`, `CreateUserDTO`)
- **Variables/Functions**: camelCase (e.g., `userId`, `createUser`)
- **Database Tables**: snake_case (e.g., `user_table`, `contract_table`)
- **Routes**: kebab-case (e.g., `/api/users`, `/api/lead-states`)
- **Environment Variables**: UPPER_SNAKE_CASE (e.g., `JWT_SECRET`)

### Configuration File Locations
- **TypeORM Configuration**: `/app-data-source.ts`
- **TypeScript Configuration**: `/tsconfig.json`
- **Environment Variables**: `/.env` (gitignored)
- **Nodemon Configuration**: `/nodemon.json`
- **Package Configuration**: `/package.json`

### Classic Request Flow
1. **HTTP Request** arrives at Express server (`app.ts`)
2. **CORS Middleware** validates cross-origin requests
3. **Route Handler** (`/src/routes/*.route.ts`) matches the endpoint
4. **Authentication Middleware** (`/src/middlewares/auth.ts`) validates JWT token
5. **Controller** (`/src/controllers/*.controller.ts`) handles the request
6. **Service Layer** (`/src/services/*.service.ts`) executes business logic
7. **TypeORM Repository** interacts with the database through entities
8. **Response** is serialized to JSON and sent back to client
9. **Error Middleware** catches and formats any errors

### Separation of Responsibilities by Folders
- **`/controllers`**: Handle HTTP requests, extract parameters, call services, return responses
- **`/services`**: Implement business logic, coordinate between repositories, handle transactions
- **`/models`**: Define database schema, entity relationships, data types
- **`/routes`**: Define API endpoints, apply middlewares, map to controllers
- **`/dto`**: Define request/response structures, provide type safety
- **`/middlewares`**: Handle cross-cutting concerns (auth, errors, file uploads)
- **`/helpers`**: Provide reusable utilities (AWS, email, integrations)
- **`/migrations`**: Track database schema changes over time
- **`/enums`**: Define constant values used across the application

## 4. DATABASE

### Database Schema
The database uses MySQL with TypeORM as the ORM. The schema follows a relational model with extensive use of foreign keys and relationships. All tables use auto-incrementing primary keys with additional UUID columns for external references.

### Main Entities
1. **User** (`user`): System users including managers and agents
2. **Lead** (`lead`): Potential customers in the sales pipeline
3. **Contract** (`contract`): Energy service contracts (electricity, gas, telephony)
4. **Customer** (`customer`): Customer information for contracts
5. **Liquidation** (`liquidation`): Commission calculations and payments
6. **Task** (`task`): Tasks and reminders for users
7. **Notification** (`notification`): System notifications
8. **Group** (`group`): Organizational hierarchy for users
9. **Absence** (`absence`): Holiday and absence tracking
10. **Document** (`file`): File storage references

### Entity Relationships
**User Entity Relationships**:
- **1:N with Contract**: One user can manage multiple contracts
- **1:N with Task**: One user can have multiple tasks
- **1:N with Notification**: One user receives multiple notifications
- **1:N with Absence**: One user can have multiple absence records
- **1:N with Liquidation**: One user can have multiple liquidations
- **N:1 with Group**: Multiple users belong to one group
- **1:1 with Lead**: One user can have one lead assigned

**Contract Entity Relationships**:
- **N:1 with Customer**: Multiple contracts per customer
- **N:1 with User**: Multiple contracts per user (salesperson)
- **N:1 with Company**: Multiple contracts per energy company
- **N:1 with Rate**: Multiple contracts can have the same rate
- **N:1 with ContractState**: Multiple contracts in the same state
- **1:N with File**: One contract can have multiple documents

**Lead Entity Relationships**:
- **N:1 with Campaign**: Multiple leads per campaign
- **N:1 with LeadState**: Multiple leads in the same state
- **1:N with LeadCall**: One lead can have multiple call records
- **1:N with LeadLog**: One lead has multiple log entries
- **1:N with LeadDocument**: One lead can have multiple documents

### Process for Creating New Entities

1. **Create Entity File**:
   ```typescript
   // src/models/new-entity.entity.ts
   import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from "typeorm";
   
   @Entity("new_entity_table")
   export class NewEntity {
     @PrimaryGeneratedColumn()
     id: number;
     
     @Column({ type: "uuid", generated: "uuid" })
     uuid: string;
     
     @Column({ type: "varchar", length: 255 })
     name: string;
     
     @CreateDateColumn()
     createdAt: Date;
     
     @UpdateDateColumn()
     updatedAt: Date;
     
     // Define relationships
     @ManyToOne(() => User, user => user.newEntities)
     user: User;
     
     @Column()
     userId: number;
   }
   ```

2. **Update Related Entities**:
   ```typescript
   // In src/models/user.entity.ts
   @OneToMany(() => NewEntity, newEntity => newEntity.user)
   newEntities: NewEntity[];
   ```

3. **Generate Migration**:
   ```bash
   npm run migration:generate
   ```

4. **Create Service**:
   ```typescript
   // src/services/new-entity.service.ts
   import { AppDataSource } from "../../app-data-source";
   import { NewEntity } from "../models/new-entity.entity";
   
   const newEntityRepository = AppDataSource.getRepository(NewEntity);
   
   export module NewEntityService {
     export const create = async (data) => {
       const newEntity = newEntityRepository.create(data);
       return await newEntityRepository.save(newEntity);
     };
   }
   ```

5. **Create Controller**:
   ```typescript
   // src/controllers/new-entity.controller.ts
   import { NewEntityService } from "../services/new-entity.service";
   
   export module NewEntityController {
     export const create = async (req, res, next) => {
       try {
         const result = await NewEntityService.create(req.body);
         res.json(result);
       } catch (err) {
         next(err);
       }
     };
   }
   ```

6. **Define Routes**:
   ```typescript
   // src/routes/new-entity.route.ts
   import { Router } from "express";
   import { NewEntityController } from "../controllers/new-entity.controller";
   import { authenticateJWT } from "../middlewares/auth";
   
   const router = Router();
   
   router.post("/", authenticateJWT, NewEntityController.create);
   
   export default router;
   ```

7. **Register Routes in app.ts**:
   ```typescript
   import newEntityRouter from "./routes/new-entity.route";
   app.use("/api/new-entities", newEntityRouter);
   ```

## 5. ENDPOINTS AND ROUTES

### Endpoint Understanding by Functionality

**Authentication Endpoints**:
- `POST /api/users/login` - User authentication
- `POST /api/users/register` - User registration
- `POST /api/users/logout` - User logout

**User Management**:
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PATCH /api/users/:id/password` - Change password

**Lead Management**:
- `GET /api/leads` - List leads with filters
- `GET /api/leads/:id` - Get lead details
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `POST /api/leads/:id/assign` - Assign lead to user
- `GET /api/leads/:id/history` - Get lead history

**Contract Management**:
- `GET /api/contracts` - List contracts with filters
- `GET /api/contracts/:id` - Get contract details
- `POST /api/contracts` - Create new contract
- `PUT /api/contracts/:id` - Update contract
- `DELETE /api/contracts/:id` - Delete contract
- `POST /api/contracts/:id/validate` - Validate contract
- `GET /api/contracts/:id/documents` - Get contract documents

**Customer Management**:
- `GET /api/customers` - List customers
- `GET /api/customers/:id` - Get customer details
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer

**Task Management**:
- `GET /api/tasks` - List user tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `PATCH /api/tasks/:id/complete` - Mark task complete

**File Management**:
- `POST /api/files/upload` - Upload file to S3
- `GET /api/files/:id` - Get file details
- `DELETE /api/files/:id` - Delete file

### Request and Response Patterns

**Standard Request Structure**:
```json
{
  "field1": "value1",
  "field2": "value2",
  "nested": {
    "subfield": "value"
  }
}
```

**Standard Success Response**:
```json
{
  "id": 1,
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  // Entity-specific fields
}
```

**Error Response Structure**:
```json
{
  "error": "Error message",
  "status": 400
}
```

**Pagination Pattern** (where implemented):
- Query parameters: `?page=1&limit=20`
- Response includes total count and pages

**Filter Pattern**:
- Query parameters for filtering: `?status=active&type=B2C`
- Date range filters: `?startDate=2024-01-01&endDate=2024-12-31`

**File Upload Pattern**:
- Multipart form data
- Field name: `file`
- Maximum size: 5MB
- Allowed types: `.png`, `.jpg`, `.jpeg`, `.pdf`, `.xlsx`, `.xls`

## 6. AUTHENTICATION AND AUTHORIZATION

### Implemented Authentication System
The system uses **JWT (JSON Web Token)** authentication with the following implementation:

**Token Generation**:
- Algorithm: HS256 (default)
- Expiration: 24 hours
- Secret: Stored in `JWT_SECRET` environment variable

**Token Payload Structure**:
```typescript
{
  userId: number,
  userEmail: string,
  userUuid: string,
  isManager: boolean,
  groupId: number,
  parentGroupId: number | null
}
```

### Security Patterns
1. **Password Hashing**: bcryptjs with 10 salt rounds
2. **Token-based Authentication**: JWT in Authorization header
3. **SQL Injection Prevention**: TypeORM parameterized queries
4. **File Upload Restrictions**: Size and type validation

### Tokens and Sessions
- **Token Type**: Bearer token
- **Token Location**: Authorization header as `Bearer <token>`
- **Token Lifetime**: 24 hours from generation
- **Refresh Token**: Not implemented
- **Session Management**: Stateless (no server-side sessions)
- **Logout**: Client-side token removal only

### Security Middleware
**Authentication Middleware** (`src/middlewares/auth.ts`):
```typescript
export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
    throw new Error("No token provided");
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      throw new Error("invalid-token");
    }
    req.user = decoded;
    next();
  });
};
```

**Protected Routes**:
- Most routes require authentication except:
  - `POST /api/users/login`
  - `POST /api/users/register`
  - Webhook endpoints

## 7. CODE STANDARDS

### Naming Conventions
- **Variables**: camelCase (`userId`, `contractType`)
- **Functions**: camelCase (`createUser`, `validateContract`)
- **Classes**: PascalCase (`UserEntity`, `ContractService`)
- **Interfaces**: PascalCase with 'I' prefix optional (`CreateUserDTO`)
- **Files**: kebab-case (`user.entity.ts`, `contract.service.ts`)
- **Database Tables**: snake_case (`user_table`, `contract_table`)
- **Database Columns**: camelCase in entities, snake_case in database
- **Routes**: kebab-case plural (`/users`, `/contract-states`)
- **Enums**: PascalCase for type, UPPER_CASE for values

### Code Style
- **Indentation**: 2 spaces
- **Quotes**: Double quotes for strings
- **Semicolons**: Used consistently
- **Line Length**: No enforced limit
- **Module Exports**: Named exports using module pattern
- **Async/Await**: Preferred over callbacks
- **Error Handling**: Try-catch blocks in controllers

### Design Patterns Used
1. **Repository Pattern**: TypeORM repositories for data access
2. **Module Pattern**: Controllers organized as modules with named exports
3. **DTO Pattern**: Data Transfer Objects for type safety
4. **Middleware Pattern**: Cross-cutting concerns (auth, errors)
5. **Service Layer Pattern**: Business logic separated from controllers

### Structure of Controllers, Services, and Models

**Controller Structure**:
```typescript
export module EntityController {
  export const create = async (req, res, next) => {
    try {
      // 1. Extract request data
      // 2. Call service method
      // 3. Return JSON response
      res.json(result);
    } catch (err) {
      next(err); // Pass to error middleware
    }
  };
}
```

**Service Structure**:
```typescript
const repository = AppDataSource.getRepository(Entity);

export module EntityService {
  export const create = async (data) => {
    // 1. Business logic validation
    // 2. Create entity
    // 3. Save to database
    // 4. Return result
    return await repository.save(entity);
  };
}
```

**Model Structure**:
```typescript
@Entity("table_name")
export class EntityName {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column({ type: "uuid", generated: "uuid" })
  uuid: string;
  
  // Column definitions
  
  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
  
  // Relationships
}
```

## 8. TESTING

### Testing Strategy
**No testing infrastructure implemented**

### Testing Tools
**Not available** - Package.json test script returns: "Error: no test specified"

### Minimum Required Coverage
**Not defined** - No testing requirements established

### Mocks and Fixtures
**Not implemented** - No test data management system

## 9. TECHNICAL DOCUMENTATION

### Data Flows
**User Authentication Flow**:
1. User submits credentials to `/api/users/login`
2. Controller validates input and calls UserService
3. Service queries database for user by email
4. Password comparison using bcrypt
5. JWT token generation with user data
6. Token returned in response
7. Client stores token for subsequent requests

**Lead to Contract Conversion Flow**:
1. Lead created in system with initial status
2. Lead assigned to sales agent
3. Agent updates lead status through stages
4. Customer data collected and validated
5. Contract created from lead data
6. Contract validation process
7. Document upload and verification
8. Contract activation
9. Commission calculation triggered

**File Upload Flow**:
1. Client sends multipart form data to `/api/files/upload`
2. Multer middleware validates file type and size
3. File uploaded to AWS S3 via aws.helper
4. S3 URL stored in database file record
5. File record associated with entity (contract, lead, etc.)
6. Response includes file ID and URL

**Liquidation Calculation Flow**:
1. Contracts marked as validated trigger calculation
2. System aggregates contracts by user and period
3. Commission rates applied based on contract type
4. Deductions and bonuses calculated
5. Liquidation record created with breakdown
6. Notification sent to user
7. Manager approval workflow
8. Payment status tracking

### Main Use Cases

**Lead Management Use Case**:
- Create lead from multiple sources (web, manual, import)
- Assign leads to agents based on availability and groups
- Track lead progress through defined states
- Log all interactions and state changes
- Convert successful leads to contracts
- Archive or reassign unsuccessful leads

**Contract Lifecycle Use Case**:
- Draft contract creation with customer data
- Document collection and upload
- Contract validation by manager
- State transitions with audit trail
- Automatic commission calculation
- Renewal and cancellation handling

**User Hierarchy Management Use Case**:
- Create organizational groups
- Assign managers to groups
- Add agents under managers
- Inherit permissions from group hierarchy
- Track performance by group
- Cascade notifications through hierarchy

## 10. BEST PRACTICES AND SPECIAL CONSIDERATIONS

### Code Quality Practices
1. **Consistent use of TypeScript** for type safety
2. **Async/await pattern** for all asynchronous operations
3. **Centralized error handling** through middleware
4. **Repository pattern** for database operations
5. **DTO pattern** for request validation

### Security Considerations
1. **Current Implementation Gaps**:
   - CORS allows all origins (security risk)
   - No rate limiting implemented
   - Basic error messages may leak information
   - No API versioning
   - Missing security headers (helmet.js)

2. **Recommendations**:
   - Implement rate limiting on authentication endpoints
   - Configure CORS for specific allowed origins
   - Add comprehensive input validation middleware
   - Implement API documentation with OpenAPI
   - Add request logging and monitoring
   - Consider refresh token implementation
   - Add security headers middleware

### Performance Considerations
1. **Database Queries**: Use TypeORM query builder for complex queries
2. **File Uploads**: Streamed directly to S3 to avoid memory issues
3. **Pagination**: Implement on all list endpoints
4. **Caching**: Not implemented but recommended for frequently accessed data

### Deployment Considerations
1. **Environment Variables**: Ensure all required variables are set
2. **Database Migrations**: Run before deployment
3. **Build Process**: Compile TypeScript before deployment
4. **Process Management**: Use PM2 or similar for production
5. **Logging**: Implement structured logging for production
6. **Monitoring**: Add APM tools for performance tracking

### Maintenance Guidelines
1. **Always use migrations** for database changes
2. **Follow existing patterns** when adding new features
3. **Update DTOs** when changing request/response structures
4. **Document breaking changes** in commit messages
5. **Test migrations** in development before production
6. **Keep dependencies updated** for security patches