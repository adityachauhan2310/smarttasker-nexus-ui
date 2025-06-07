import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import swaggerSpec from '../config/swagger';

/**
 * Generate TypeScript interface from OpenAPI schema
 * @param schemaName Name of the schema
 * @param schema OpenAPI schema
 * @returns TypeScript interface string
 */
function generateInterface(schemaName: string, schema: any): string {
  let output = `export interface ${schemaName} {\n`;
  
  // Handle nested properties
  if (schema.properties) {
    Object.entries(schema.properties).forEach(([propName, propSchema]: [string, any]) => {
      const nullable = propSchema.nullable ? ' | null' : '';
      let type = 'any';
      
      // Handle different types
      if (propSchema.type === 'string') {
        if (propSchema.format === 'date-time') {
          type = 'Date';
        } else if (propSchema.format === 'ObjectId') {
          type = 'string'; // MongoDB ObjectId as string in TypeScript
        } else if (propSchema.enum) {
          type = propSchema.enum.map((val: string) => `'${val}'`).join(' | ');
        } else {
          type = 'string';
        }
      } else if (propSchema.type === 'number' || propSchema.type === 'integer') {
        type = 'number';
      } else if (propSchema.type === 'boolean') {
        type = 'boolean';
      } else if (propSchema.type === 'array') {
        if (propSchema.items.type === 'string') {
          if (propSchema.items.format === 'ObjectId') {
            type = 'string[]';
          } else if (propSchema.items.enum) {
            const enumType = propSchema.items.enum.map((val: string) => `'${val}'`).join(' | ');
            type = `Array<${enumType}>`;
          } else {
            type = 'string[]';
          }
        } else if (propSchema.items.type === 'number' || propSchema.items.type === 'integer') {
          type = 'number[]';
        } else if (propSchema.items.type === 'boolean') {
          type = 'boolean[]';
        } else if (propSchema.items.type === 'object') {
          // Check if this is a reference to another schema
          if (propSchema.items.$ref) {
            const refType = propSchema.items.$ref.split('/').pop();
            type = `${refType}[]`;
          } else {
            type = 'any[]';
          }
        } else {
          type = 'any[]';
        }
      } else if (propSchema.type === 'object') {
        if (propSchema.additionalProperties === true) {
          type = 'Record<string, any>';
        } else if (propSchema.$ref) {
          const refType = propSchema.$ref.split('/').pop();
          type = refType;
        } else {
          type = 'Record<string, any>';
        }
      }
      
      output += `  ${propName}${schema.required?.includes(propName) ? '' : '?'}: ${type}${nullable};\n`;
    });
  }
  
  output += '}\n\n';
  return output;
}

/**
 * Generate API response types
 * @param responses OpenAPI response objects
 * @returns TypeScript type string
 */
function generateResponseType(operationId: string, responses: any): string {
  // Find 200 or 201 response
  const successResponse = responses['200'] || responses['201'];
  if (!successResponse) return '';
  
  let output = '';
  const typeName = `${operationId.charAt(0).toUpperCase() + operationId.slice(1)}Response`;
  
  if (successResponse.content && successResponse.content['application/json']) {
    const schema = successResponse.content['application/json'].schema;
    
    if (schema.$ref) {
      // Reference to existing type
      const refType = schema.$ref.split('/').pop();
      output += `export type ${typeName} = ${refType};\n\n`;
    } else if (schema.type === 'array') {
      if (schema.items.$ref) {
        const refType = schema.items.$ref.split('/').pop();
        output += `export type ${typeName} = ${refType}[];\n\n`;
      } else {
        output += `export type ${typeName} = any[];\n\n`;
      }
    } else if (schema.type === 'object') {
      output += `export interface ${typeName} {\n`;
      
      if (schema.properties) {
        Object.entries(schema.properties).forEach(([propName, propSchema]: [string, any]) => {
          const nullable = (propSchema as any).nullable ? ' | null' : '';
          let type = 'any';
          
          // Determine type (similar to generateInterface)
          // This is simplified, you'd want to handle more cases in a real implementation
          if ((propSchema as any).type === 'string') {
            type = 'string';
          } else if ((propSchema as any).type === 'number') {
            type = 'number';
          } else if ((propSchema as any).type === 'boolean') {
            type = 'boolean';
          } else if ((propSchema as any).$ref) {
            const refType = (propSchema as any).$ref.split('/').pop();
            type = refType;
          }
          
          output += `  ${propName}${schema.required?.includes(propName) ? '' : '?'}: ${type}${nullable};\n`;
        });
      }
      
      output += '}\n\n';
    } else {
      // Default to any
      output += `export type ${typeName} = any;\n\n`;
    }
  }
  
  return output;
}

/**
 * Generate API client types
 */
function generateApiTypes() {
  let output = '// This file is auto-generated. Do not edit manually.\n\n';
  
  // Generate model interfaces
  output += '// Model Types\n';
  const schemas = swaggerSpec.components.schemas;
  
  Object.entries(schemas).forEach(([schemaName, schema]) => {
    output += generateInterface(schemaName, schema);
  });
  
  // Generate API endpoint types
  output += '// API Response Types\n';
  const paths = swaggerSpec.paths;
  
  Object.entries(paths).forEach(([path, pathItem]: [string, any]) => {
    Object.entries(pathItem).forEach(([method, operation]: [string, any]) => {
      if (operation.operationId && operation.responses) {
        output += generateResponseType(operation.operationId, operation.responses);
      }
    });
  });
  
  // Generate request parameter types
  output += '// API Request Parameter Types\n';
  
  Object.entries(paths).forEach(([path, pathItem]: [string, any]) => {
    Object.entries(pathItem).forEach(([method, operation]: [string, any]) => {
      if (operation.operationId && operation.parameters) {
        const typeName = `${operation.operationId.charAt(0).toUpperCase() + operation.operationId.slice(1)}Params`;
        output += `export interface ${typeName} {\n`;
        
        operation.parameters.forEach((param: any) => {
          const required = param.required ? '' : '?';
          const type = param.schema.type === 'integer' ? 'number' : param.schema.type;
          output += `  ${param.name}${required}: ${type};\n`;
        });
        
        output += '}\n\n';
      }
      
      // Generate request body type
      if (operation.operationId && operation.requestBody) {
        const content = operation.requestBody.content['application/json'];
        if (content && content.schema) {
          const typeName = `${operation.operationId.charAt(0).toUpperCase() + operation.operationId.slice(1)}Body`;
          
          if (content.schema.$ref) {
            const refType = content.schema.$ref.split('/').pop();
            output += `export type ${typeName} = ${refType};\n\n`;
          } else if (content.schema.type === 'object') {
            output += `export interface ${typeName} {\n`;
            
            Object.entries(content.schema.properties || {}).forEach(([propName, propSchema]: [string, any]) => {
              const nullable = propSchema.nullable ? ' | null' : '';
              const required = (content.schema.required || []).includes(propName) ? '' : '?';
              let type = 'any';
              
              if (propSchema.type === 'string') {
                type = propSchema.enum ? propSchema.enum.map((v: string) => `'${v}'`).join(' | ') : 'string';
              } else if (propSchema.type === 'number' || propSchema.type === 'integer') {
                type = 'number';
              } else if (propSchema.type === 'boolean') {
                type = 'boolean';
              } else if (propSchema.type === 'array') {
                if (propSchema.items.$ref) {
                  const refType = propSchema.items.$ref.split('/').pop();
                  type = `${refType}[]`;
                } else {
                  type = `${propSchema.items.type || 'any'}[]`;
                }
              } else if (propSchema.$ref) {
                type = propSchema.$ref.split('/').pop();
              }
              
              output += `  ${propName}${required}: ${type}${nullable};\n`;
            });
            
            output += '}\n\n';
          }
        }
      }
    });
  });
  
  // Write output to file
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const outputPath = path.resolve(__dirname, '../../../types/api-types.ts');
  fs.writeFileSync(outputPath, output);
  
  console.log(`✅ API types generated: ${outputPath}`);
}

// Execute when this file is run directly
generateApiTypes();

export default generateApiTypes;