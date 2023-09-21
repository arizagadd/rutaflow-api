// import { PrismaClient } from '@prisma/client';
// /**
//  * [] checklist
//  * [] checklist_event
//  * [] client
//  * [] cms_menu
//  * [] delivery_week
//  * [] driver
//  * [] enterprise
//  * [] event
//  * [] event_template
//  * [] evidence
//  * [] log
//  * [] mc_log
//  * [] mc_template
//  * [] report
//  * [] route
//  * [] route_template
//  * [] stop
//  * [] support_log
//  * [] user
//  * [] vehicle

//  */
// const prisma = new PrismaClient();

// async function main() {
//         const enterprise = await prisma.enterprise.create({
//                 data: {
//                         name: 'Enterprise 1',
//                         id_owner: 1,
//                         components: 'component 1',
//                         description: 'description 1',
//                         objective: 'LOGISTICS',
//                         settings: 'settings 1',
//                         client: null, // reference to client model
//                 },
//         });

//         const user = await prisma.user.create({
//                 data: {
//                         id_enterprise: enterprise.id_enterprise,
//                         // Fill in data for user
//                 },
//         });

//         const driver = await prisma.driver.create({
//                 data: {
//                         id_user: user.id_user,
//                         // Fill in data for driver
//                 },
//         });

//         const vehicle = await prisma.vehicle.create({
//                 data: {
//                         id_enterprise: enterprise.id_enterprise,
//                         // Fill in data for vehicle
//                 },
//         });

//         const client = await prisma.client.create({
//                 data: {
//                         id_enterprise: 1,
//                         name: 'name 1',
//                         contract_description: 'contract description 1',
//                         pickup_time: 33,
//                         delivery_time: 22,
//                         checklist: [],
//                 },
//         });

//         const route_template = await prisma.route_template.create({
//                 data: {
//                         id_enterprise: enterprise.id_enterprise,
//                         // Fill in data for route_template
//                 },
//         });

//         const stop = await prisma.stop.create({
//                 data: {
//                         id_client: client.id_client,
//                         // Fill in data for stop
//                 },
//         });

//         const route = await prisma.route.create({
//                 data: {
//                         id_enterprise: enterprise.id_enterprise,
//                         id_client: client.id_client,
//                         id_vehicle: vehicle.id_vehicle,
//                         id_driver: driver.id_driver,
//                         id_route_template: route_template.id_route_template,
//                         // Fill in data for route
//                 },
//         });

//         const event = await prisma.event.create({
//                 data: {
//                         id_route: route.id_route,
//                         // Fill in data for event
//                 },
//         });

//         const event_template = await prisma.event_template.create({
//                 data: {
//                         id_route_template: route_template.id_route_template,
//                         // Fill in data for event_template
//                 },
//         });

//         const checklist_event = await prisma.checklist_event.create({
//                 data: {
//                         // Fill in data for checklist_event
//                 },
//         });

//         const support_log = await prisma.support_log.create({
//                 data: {
//                         id_subscriber: 1, // Assuming a subscriber with ID=1 exists
//                         // Fill in data for support_log
//                 },
//         });

//         console.log('Seeding done.');
// }

// main()
//         .catch((e) => {
//                 console.error(e);
//                 process.exit(1);
//         })
//         .finally(async () => {
//                 await prisma.$disconnect();
//         });
