package sample;

@Configuration
@EnableMethodSecurity
class SecurityConfig {
    @Bean
    SecurityFilterChain api(HttpSecurity http) throws Exception {
        return http.authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/notices/**", "/api/records/**").permitAll()
            .anyRequest().authenticated()).build();
    }
}
